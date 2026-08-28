import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * API 응답 캐싱 전용 Zustand 스토어
 *
 * - sessionStorage에 저장 → 탭/브라우저 닫으면 자동 소멸
 * - archiveStore(localStorage)와 분리 → 캐시는 세션 단위 관리
 *
 * 사용 예:
 *   const { getCache, setCache } = useCacheStore();
 *   const cached = getCache("genres_music", 60 * 60 * 1000); // 60분 TTL
 *   if (cached) { ... } else { const data = await fetch(); setCache("genres_music", data); }
 */
const useCacheStore = create(
  persist(
    (set, get) => ({
      // { [cacheKey]: { data: any, timestamp: number } }
      cache: {},

      /**
       * 캐시에서 데이터를 읽습니다.
       * @param {string} key - 캐시 키
       * @param {number} ttlMs - 유효 시간 (밀리초). 이 시간이 지난 항목은 null 반환
       * @returns {any|null} - 유효한 캐시 데이터 또는 null
       */
      getCache: (key, ttlMs) => {
        const entry = get().cache[key];
        if (!entry) return null;
        //유호시간 지났으면 펑
        const isExpired = Date.now() - entry.timestamp > ttlMs;
        if (isExpired) return null;
        return entry.data;
      },

      /**
       * 캐시에 데이터를 저장합니다.
       * @param {string} key - 캐시 키
       * @param {any} data - 저장할 데이터
       */
      //데이터를 키와 저장
      setCache: (key, data) =>
        set((state) => ({
          cache: {
            ...state.cache,
            [key]: { data, timestamp: Date.now() },
          },
        })),

      /**
       * 전체 캐시를 초기화합니다. (개발/테스트용)
       */
      //데이터 모두 삭제
      clearCache: () => set({ cache: {} }),
    }),
    {
      name: "habitus_cache",                           // sessionStorage 키 이름
      storage: createJSONStorage(() => sessionStorage), // localStorage 대신 sessionStorage 사용
    }
  )
);

export default useCacheStore;
