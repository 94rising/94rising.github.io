import { type CollectionEntry } from 'astro:content';

export function sortItemsByDateDesc(itemA: CollectionEntry<'blogs'>, itemB: CollectionEntry<'blogs'>) {
    return new Date(itemB.data.pubDate).getTime() - new Date(itemA.data.pubDate).getTime();
}

export function createSlugFromTitle(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s-]/gu, '') // Remove special characters but keep unicode letters and numbers
        .trim()
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-'); // Replace multiple hyphens with a single hyphen
}

export function getAllTags(posts: CollectionEntry<'blogs'>[]) {
    const tags: string[] = [...new Set(posts.flatMap((post) => post.data.tags || []).filter(Boolean))];
    return tags
        .map((tag) => {
            return {
                name: tag,
                id: createSlugFromTitle(tag)
            };
        })
        .filter((tag) => tag.id.length > 0) // Filter out empty IDs
        .filter((obj, pos, arr) => {
            return arr.map((mapObj) => mapObj.id).indexOf(obj.id) === pos;
        });
}

export function getPostsByTag(posts: CollectionEntry<'blogs'>[], tagId: string) {
    const filteredPosts: CollectionEntry<'blogs'>[] = posts.filter((post) => (post.data.tags || []).map((tag) => createSlugFromTitle(tag)).includes(tagId));
    return filteredPosts;
}

export const withBase = (path: string) => {
    const base = import.meta.env.BASE_URL || '/';
    // base가 '/'인 경우 그냥 path 반환 (중복 슬래시 방지)
    if (base === '/') return path;
    // base가 다른 경우 슬래시 중복 제거 후 결합
    return `${base.replace(/\/$/, '')}${path}`;
};