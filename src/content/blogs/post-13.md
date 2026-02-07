---
title: "Azure Workload Identity 전면 적용기: Redis에서 AI Foundry까지"
author: "이순범"
description: "세 가지 함정을 넘어 Redis, Blob Storage, AI Foundry에 Workload Identity를 성공적으로 적용한 과정"
image:
  url: "../../assets/images/13.jpg"
  alt: "Azure Workload Identity를 통한 다양한 리소스 접근 구성도"
pubDate: 2026-02-04
tags: ["Azure", "AKS", "Workload Identity", "Redis", "Blob Storage", "AI Foundry", "Security"]
---

## 들어가며

Azure AKS에서 Service Principal 방식을 Workload Identity로 전환하는 작업을 진행했습니다. Redis를 시작으로 Blob Storage, AI Foundry까지 확장하면서 많은 시행착오를 겪었지만, 결과적으로 보안과 운영성 모두를 크게 개선할 수 있었습니다.

이 글에서는 첫 적용 대상이었던 Redis에서 마주한 세 가지 주요 함정과, 이를 바탕으로 Blob Storage와 AI Foundry에 빠르게 적용할 수 있었던 경험을 공유합니다.

## Part 1: Redis - 세 가지 함정과의 조우

### 함정 1: 파드 레이블 누락

**증상**
```bash
$ kubectl logs <pod-name>
Error: failed to acquire token: [authentication failed]
```

Redis 접근이 계속 실패했습니다. Workload Identity 설정은 모두 완료했다고 생각했는데 인증이 되지 않았습니다.

**원인**

Deployment manifest를 확인해보니 파드 레이블이 누락되어 있었습니다.
```yaml
# ❌ 잘못된 설정
apiVersion: apps/v1
kind: Deployment
metadata:
  name: example-app
spec:
  template:
    metadata:
      labels:
        app: example-app
        # azure.workload.identity/use: "true" <- 이게 없었음!
```

**해결**
```yaml
# ✅ 수정된 설정
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    metadata:
      labels:
        app: example-app
        azure.workload.identity/use: "true"
    spec:
      serviceAccountName: workload-identity-sa
```

### 함정 2: Redis 인증 방식 오류

**증상**
```
Error: NOAUTH Authentication required
```

Workload Identity 토큰은 정상 발급되는데, Redis 접근 시 인증 에러가 발생했습니다.

**원인**

기존 password 기반 인증 코드를 그대로 사용하고 있었습니다.
```python
# ❌ 문제가 있던 코드
redis_client = redis.Redis(
    host=redis_host,
    port=6380,
    ssl=True,
    password=None
)
```

**해결**

Azure AD 토큰 기반 인증으로 변경했습니다.
```python
# ✅ 수정된 코드
from azure.identity import DefaultAzureCredential
from redis import Redis

credential = DefaultAzureCredential()
token = credential.get_token("https://redis.azure.com/.default")

redis_client = Redis(
    host=redis_host,
    port=6380,
    ssl=True,
    username=token.token,  # Azure AD 토큰을 username으로 사용
    password="",
    decode_responses=True
)
```

추가로 Redis RBAC에서 Managed Identity에 `Redis Cache Contributor` 역할을 부여했습니다.

### 함정 3: 환경변수 충돌 - 가장 교묘한 함정

**증상**

DEV는 정상, STG는 실패하는 이상한 상황이었습니다.

**원인**

STG 환경에 이전 Service Principal 방식의 환경변수가 남아있었습니다.
```yaml
# ❌ STG 환경 설정
env:
- name: AZURE_CLIENT_ID
  value: "xxxxx-xxxx-xxxx-xxxx-xxxxxxxxx"  # 이전 방식의 잔재
- name: REDIS_PASSWORD
  valueFrom:
    secretKeyRef:
      name: redis-secret
      key: password
```

`DefaultAzureCredential`의 credential chain 우선순위 때문에 환경변수의 old client ID를 먼저 시도하고 실패했습니다.

**해결**

환경변수를 완전히 제거했습니다.
```yaml
# ✅ 수정된 설정
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    metadata:
      labels:
        azure.workload.identity/use: "true"
    spec:
      serviceAccountName: workload-identity-sa
      containers:
      - name: app
        # env 섹션에서 AZURE_CLIENT_ID, REDIS_PASSWORD 제거
```

## Part 2: Blob Storage - Redis의 교훈 적용

Redis에서 배운 교훈 덕분에 Blob Storage 적용은 훨씬 수월했습니다.

### 체크리스트 기반 접근

Redis 트러블슈팅을 바탕으로 만든 체크리스트:

1. ✅ 파드 레이블 확인
2. ✅ 환경변수 제거 (AZURE_STORAGE_CONNECTION_STRING 등)
3. ✅ RBAC 역할 부여
4. ✅ SDK 코드 변경

### Blob Storage 특이사항

**필요한 RBAC 역할**
```bash
az role assignment create \
  --role "Storage Blob Data Contributor" \
  --assignee <managed-identity-client-id> \
  --scope /subscriptions/<subscription-id>/resourceGroups/<resource-group>/providers/Microsoft.Storage/storageAccounts/<storage-account>
```

**코드 변경**
```python
# ❌ 기존 방식 (Connection String)
from azure.storage.blob import BlobServiceClient

connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
blob_service_client = BlobServiceClient.from_connection_string(connection_string)
```
```python
# ✅ Workload Identity 방식
from azure.identity import DefaultAzureCredential
from azure.storage.blob import BlobServiceClient

credential = DefaultAzureCredential()
account_url = "https://yourstorageaccount.blob.core.windows.net"
blob_service_client = BlobServiceClient(account_url, credential=credential)
```

### 주의사항

Blob Storage는 Redis와 달리 **Storage Account 방화벽 규칙**을 확인해야 합니다. AKS의 Outbound IP를 허용 목록에 추가하거나 Private Endpoint를 사용해야 합니다.
```bash
# AKS Outbound IP 확인
az network public-ip list \
  --resource-group MC_<resource-group>_<aks-cluster-name>_<region> \
  --query "[].ipAddress" -o tsv
```

## Part 3: AI Foundry - 패턴 완성

AI Foundry 적용은 이전 경험을 바탕으로 가장 빠르게 완료했습니다.

### AI Foundry 설정

**필요한 RBAC 역할**
```bash
az role assignment create \
  --role "Cognitive Services OpenAI User" \
  --assignee <managed-identity-client-id> \
  --scope /subscriptions/<subscription-id>/resourceGroups/<resource-group>/providers/Microsoft.CognitiveServices/accounts/<openai-resource>
```

**코드 변경**
```python
# ❌ 기존 방식 (API Key)
import openai

openai.api_key = os.getenv("AZURE_OPENAI_API_KEY")
openai.api_base = "https://your-resource.openai.azure.com"
```
```python
# ✅ Workload Identity 방식
from azure.identity import DefaultAzureCredential
from openai import AzureOpenAI

credential = DefaultAzureCredential()
token = credential.get_token("https://cognitiveservices.azure.com/.default")

client = AzureOpenAI(
    azure_endpoint="https://your-resource.openai.azure.com",
    azure_ad_token=token.token,
    api_version="2024-02-01"
)
```

### AI Foundry 특이사항

**토큰 갱신 처리**

OpenAI 클라이언트는 장시간 실행되는 경우가 많으므로 토큰 갱신 로직이 필요합니다.
```python
import time
from azure.identity import DefaultAzureCredential

class TokenRefreshingCredential:
    def __init__(self):
        self.credential = DefaultAzureCredential()
        self.token = None
        self.expires_on = 0
    
    def get_token(self):
        if time.time() >= self.expires_on - 300:  # 5분 전에 갱신
            token_response = self.credential.get_token(
                "https://cognitiveservices.azure.com/.default"
            )
            self.token = token_response.token
            self.expires_on = token_response.expires_on
        return self.token

# 사용 예시
token_manager = TokenRefreshingCredential()
client = AzureOpenAI(
    azure_endpoint="https://your-resource.openai.azure.com",
    azure_ad_token_provider=token_manager.get_token,
    api_version="2024-02-01"
)
```

## 통합 체크리스트

세 가지 리소스 적용을 통해 완성한 **Workload Identity 적용 표준 절차**:

### 1. Azure 인프라 설정
```bash
# Managed Identity 생성
az identity create \
  --name <identity-name> \
  --resource-group <resource-group>

# Federated Credential 생성
az identity federated-credential create \
  --name <federated-credential-name> \
  --identity-name <identity-name> \
  --resource-group <resource-group> \
  --issuer <aks-oidc-issuer-url> \
  --subject system:serviceaccount:<namespace>:<service-account-name>

# RBAC 역할 부여
# Redis: Redis Cache Contributor
# Blob: Storage Blob Data Contributor
# AI Foundry: Cognitive Services OpenAI User
```

### 2. Kubernetes 설정
```yaml
# Service Account 생성
apiVersion: v1
kind: ServiceAccount
metadata:
  name: workload-identity-sa
  namespace: default
  annotations:
    azure.workload.identity/client-id: <managed-identity-client-id>

---
# Deployment 수정
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    metadata:
      labels:
        azure.workload.identity/use: "true"  # 필수!
    spec:
      serviceAccountName: workload-identity-sa
      containers:
      - name: app
        # ⚠️ 환경변수에서 다음 제거:
        # - AZURE_CLIENT_ID
        # - AZURE_CLIENT_SECRET
        # - AZURE_TENANT_ID
        # - *_CONNECTION_STRING
        # - *_API_KEY
```

### 3. 애플리케이션 코드 검증 포인트
- [ ] `DefaultAzureCredential` 사용
- [ ] 환경변수 인증 정보 제거
- [ ] 리소스별 적절한 scope 사용
- [ ] 장기 실행 애플리케이션은 토큰 갱신 로직 구현

## 배운 점

### 1. 패턴화가 핵심
첫 번째 리소스(Redis)에서 체크리스트를 만들어두니, 나머지는 빠르게 적용할 수 있었습니다.

### 2. 환경별 차이 주의
DEV/STG/PRD 각 환경의 설정을 꼼꼼히 확인해야 합니다. 특히 환경변수는 Git에 없어도 Kubernetes Secret이나 ConfigMap에 남아있을 수 있습니다.

### 3. 리소스별 특이사항 문서화
- Redis: Azure AD 토큰 인증
- Blob Storage: 방화벽 규칙, Private Endpoint
- AI Foundry: 토큰 갱신 로직

각 리소스의 특이사항을 미리 정리해두면 다음 적용 시 시행착오를 줄일 수 있습니다.

### 4. 보안 개선 효과
- API Key, Connection String 노출 위험 제거
- Secret 관리 부담 감소
- RBAC 기반 세밀한 권한 제어 가능

## 마치며

Redis에서 마주한 세 가지 함정(파드 레이블, 인증 방식, 환경변수 충돌)을 해결하며 배운 교훈이 Blob Storage와 AI Foundry 적용을 빠르게 만들었습니다.

Workload Identity 전환은 초기 러닝 커브가 있지만, 보안과 운영성 측면에서 분명한 이득이 있습니다. 특히 API Key 관리 부담이 사라지고, Secret Rotation 걱정이 없어진 것이 가장 큰 장점입니다.

앞으로 새로운 Azure 리소스를 사용할 때도 이 패턴을 계속 적용할 계획입니다.

---

**관련 링크**
- [Azure Workload Identity 공식 문서](https://azure.github.io/azure-workload-identity/)
- [Azure Cache for Redis with Azure AD](https://learn.microsoft.com/en-us/azure/azure-cache-for-redis/cache-azure-active-directory-for-authentication)
- [Azure Storage with Managed Identity](https://learn.microsoft.com/en-us/azure/storage/blobs/authorize-access-azure-active-directory)
- [Azure OpenAI with Managed Identity](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/managed-identity)