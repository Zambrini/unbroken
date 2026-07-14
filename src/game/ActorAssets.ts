import challengerUrl from '../assets/actors/challenger.png';
import heirV01OpenUrl from '../assets/actors/heir-v01-open.png';
import heirV01SealedUrl from '../assets/actors/heir-v01-sealed.png';
import heirV37OpenUrl from '../assets/actors/heir-v37-open.png';
import heirV37SealedUrl from '../assets/actors/heir-v37-sealed.png';

export const ACTOR_ASSET_URLS = {
  challenger: challengerUrl,
  heirV01Sealed: heirV01SealedUrl,
  heirV01Open: heirV01OpenUrl,
  heirV37Sealed: heirV37SealedUrl,
  heirV37Open: heirV37OpenUrl,
} as const;

export type HeirActorAssetKey = Exclude<keyof typeof ACTOR_ASSET_URLS, 'challenger'>;

export function selectHeirActorAsset(version: 1 | 37, vulnerable: boolean): HeirActorAssetKey {
  if (version === 37) return vulnerable ? 'heirV37Open' : 'heirV37Sealed';
  return vulnerable ? 'heirV01Open' : 'heirV01Sealed';
}
