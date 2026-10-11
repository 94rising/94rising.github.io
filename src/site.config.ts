import { withBase } from "./utils/helpers";

export type Image = {
    src: string;
    alt?: string;
    caption?: string;
};

export type Link = {
    text: string;
    href: string;
    // 자체 레이아웃을 쓰는 페이지는 swup 전환 대신 전체 페이지 로드
    noSwup?: boolean;
};

export type Hero = {
    eyebrowText?: string;
    title?: string;
    text?: string;
    image?: Image;
    actions?: Link[];
};

export type About = {
    title?: string;
    text?: string;
};

export type Blog = {
    description?: string;
};

export type ContactInfo = {
    title?: string;
    text?: string;
    email?: {
        text?: string;
        href?: string;
        email?: string;
    };
    socialProfiles?: {
        text?: string;
        href?: string;
    }[];
};

export type Subscribe = {
    title?: string;
    text?: string;
    formUrl: string;
};

export type SiteConfig = {
    website: string;
    logo?: Image;
    title: string;
    description: string;
    image?: Image;
    headerNavLinks?: Link[];
    footerNavLinks?: Link[];
    socialLinks?: Link[];
    hero?: Hero;
    about?: About;
    contactInfo?: ContactInfo;
    subscribe?: Subscribe;
    blog?: Blog;
    postsPerPage?: number;
    recentPostLimit: number;
    projectsPerPage?: number;
};

const siteConfig: SiteConfig = {
    website: 'https://example.com',
    title: 'A TWOSOONBUM PLACE',
    description: 'A minimal space-inspired personal blog template built with Astro.js and Tailwind CSS, by Siddhesh Thadeshwar',
    image: {
        src: '/assets/images/lsb_cover.png',
        alt: 'A TWOSOONBUM PLACE ✨'
    },
    headerNavLinks: [
        {
            text: 'Home',
            href: withBase('/')
        },
        {
            text: 'Tech',
            href: withBase('/tech')
        },
        {
            text: 'Blog',
            href: withBase('/blog')
        },
        {
            text: 'Tags',
            href: withBase('/tags')
        },
        {
            text: 'Portfolio',
            href: withBase('/portfolio'),
            noSwup: true
        },
        {
            text: 'About',
            href: withBase('/about')
        },
        {
            text: 'Contact',
            href: withBase('/contact')
        }
    ],
    footerNavLinks: [
        {
            text: 'About',
            href: withBase('/about')
        },
        {
            text: 'Contact',
            href: withBase('/contact')
        },
        {
            text: 'RSS Feed',
            href: withBase('/rss.xml')
        },
                {
            text: 'Sitemap',
            href: withBase('/sitemap-index.xml')
        }
    ],
    socialLinks: [
        {
            text: 'Dribbble',
            href: 'https://dribbble.com/'
        },
        {
            text: 'Instagram',
            href: 'https://instagram.com/'
        },
        {
            text: 'X/Twitter',
            href: 'https://twitter.com/'
        }
    ],
    hero: {
        eyebrowText: 'Burgers & Bytes',
        title: 'A TWOSOONBUM PLACE ✨',
        text: `기술 리뷰, 경험 기록.
햄버거 먹다가 생각난 것들 적어두는 곳`,
        image: {
            src: '/assets/images/pixeltrue-space-discovery.svg',
            alt: 'A person sitting at a desk in front of a computer'
        },
        actions: [
            {
                text: 'Read Now',
                href: withBase('/blog')
            },
            {
                text: 'Subscribe',
                href: '#subscribe'
            }
        ]
    },
    about: {
        title: 'About',
        text: 'A TWOSOONBUM PLACE는 자동화와 생산성에 관한 블로그입니다. 멀티 클라우드 세계의 DevOps 엔지니어이자 반복 작업 킬러인 이순범이 글을 쓰고 있습니다. 귀찮은 일을 없애는 집착과 AI 도구에 대한 끝없는 호기심으로 유명합니다. 그 과정에서 AI와 친구가 되었습니다. \n 가끔 햄버거도 먹습니다. 🍔.',
    },
    contactInfo: {
        title: 'Contact',
        text: "Hi! Whether you have a question, a suggestion, or just want to share your thoughts, I'm all ears. Feel free to get in touch through any of the methods below:",
        email: {
            text: "Drop me an email and I’ll do my best to respond as soon as possible.",
            href: "mailto:example@example.com",
            email: "nice47264231@gmail.com"
        },
        socialProfiles: [
            {
                text: "LinkedIn",
                href: "https://www.linkedin.com/"
            },
            {
                text: "GitHub",
                href: "https://github.com/"
            }
        ]
    },
    subscribe: {
        title: 'Subscribe to A TWOSOONBUM PLACE',
        text: 'One update per week. All the latest stories in your inbox.',
        formUrl: '#'
    },
    blog: {
        description: "DevOps engineer writing about work, experiences, and random thoughts between burger bites."
    },
    postsPerPage: 10,
    recentPostLimit: 3
};

export default siteConfig;
