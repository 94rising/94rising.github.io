---
title: "Sprint 2025-BY26-13 : Azure 보안 아키텍처 전환기: NSG에서 WAF Policy로"
author: "이순범"
description: "NSG 기반 보안 관리를 WAF Policy 중심으로 전환하면서 얻은 교훈들"
image:
  url: "../../assets/images/12.png"
  alt: "Azure WAF Architecture"
pubDate: 2026-01-22
tags: ["Azure", "WAF", "DevOps", "Security"]
---

이번 스프린트 동안 Azure 거버넌스 체계를 대대적으로 개편하는 작업을 진행했다. 기존 NSG(Network Security Group) 기반의 보안 관리를 WAF(Web Application Firewall) Policy 중심으로 전환한 경험을 공유한다.

## 왜 전환이 필요했나

기존에는 NSG를 통해 네트워크 레벨에서 트래픽을 제어하고 있었다. NSG는 IP/Port 기반의 L3-L4 레벨 필터링에는 효과적이지만, 웹 애플리케이션 특화 공격(SQL Injection, XSS 등)에 대한 방어에는 한계가 있다.

조직 차원에서 보안 거버넌스를 강화하면서 Application Gateway + WAF Policy 조합으로 전환하게 되었다. 새로운 구조에서 NSG는 Any Open 상태로 두고, 실제 트래픽 필터링은 WAF에서 담당한다.
```
[인바운드 트래픽] → [NSG: Any Allow] → [Application Gateway + WAF Policy] → [Backend Pool]
```

## 서비스별 WAF 분리 운영

전환 과정에서 가장 고민했던 부분은 WAF Policy의 규칙 제한이었다. Azure WAF Policy는 Custom Rule 기준 최대 100개까지만 지원한다.

문제는 특정 서비스의 경우 허용해야 할 IP 대역이나 조건부 규칙이 100개를 초과할 수 있다는 점이다. 현재 dev, qa, prd 각 환경에 20개씩, 총 60개의 서비스를 운영하고 있는데, 결국 서비스별로 WAF Policy를 분리 운영하는 방식을 채택했다.

| 구분 | WAF Policy | 비고 |
|------|------------|------|
| 서비스 A | waf-policy-service-a | 내부 API, 규칙 약 30개 |
| 서비스 B | waf-policy-service-b | 외부 연동 多, 규칙 80개+ |
| 서비스 C | waf-policy-service-c | 파트너사 접근, 규칙 60개 |

이 구조가 관리 복잡도를 높이는 건 사실이지만, 각 서비스 특성에 맞는 세밀한 정책 적용이 가능해졌다.

## 멀티 환경(Dev/QA/Prd) 마이그레이션

dev, qa, prd 세 환경에 흩어져 있던 기존 방화벽 규칙들을 정리하고 WAF로 이전하는 작업도 병행했다. 환경별 20개씩 총 60개 서비스의 방화벽 정책을 전환하면서 몇 가지 교훈을 얻었다.

**문서화의 중요성**

기존 NSG 규칙 중 "왜 이 IP가 열려있는지" 히스토리가 없는 경우가 많았다. 전환하면서 각 규칙의 목적과 요청자를 추적하는 데 상당한 시간이 소요되었다.

**환경별 일관성**

dev에만 열려있고 prd에는 없는 규칙, 또는 그 반대인 경우가 발견되었다. 이번 기회에 환경 간 정책을 정렬했다.

## Application Gateway 리스너 관련 삽질

AGIC(Application Gateway Ingress Controller)를 AKS와 연동하면 리스너가 자동 생성될 거라 기대했는데, 실제로는 수동으로 구성해야 했다.

또한 Application Gateway의 리스너는 기본적으로 하나의 Default 리스너만 사용해야 한다는 점도 이번에 알게 되었다. Multi-site 리스너 구성 시 호스트 헤더 기반으로 라우팅을 분기하는 방식인데, 초기 설계 시 이 부분을 간과해서 재작업이 필요했다.

## 마치며

이번 작업을 통해 Azure 네트워킹에 대한 이해가 한층 깊어졌다. 동시에 아직 부족한 부분도 많다는 걸 체감했다. 특히 Application Gateway, WAF, NSG, 그리고 AKS AGIC가 어떻게 상호작용하는지 전체 그림을 그리는 데 시간이 걸렸다.

100개 규칙 제한이 왜 존재하는지는 여전히 의문이지만, 제약 조건 안에서 최적의 구조를 찾아가는 것도 엔지니어링의 일부라 생각한다.