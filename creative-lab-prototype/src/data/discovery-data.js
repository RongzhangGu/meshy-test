import { products } from './products.js';
const aliases = {
  egg: '扭扭龙蛋 扭蛋 蛋 capsule twist toy',
  collapsible: '可折叠 减压 玩具 silhouette fidget toy',
  plantpot: '花盆 植物 园艺 桌面 planter garden desk home gift',
  terrain: '桌面 地形 地图 山 山脉 map landscape mountain',
  pixleap: '相框 立体 展示 显示器 display frame',
  keychain: '钥匙扣 随身 礼物 宠物 keyring gift pet photo',
  chibi: '手办 人物 人像 miniature portrait',
  vinyl: '潮玩 搪胶 公仔 toy collectible',
  pet: '宠物 纪念 猫 狗 cat dog keepsake',
  brick: '积木 人偶 lego toy',
  lamp: '灯 夜灯 家居 桌面 light lighting home desk gift',
  keycap: '键帽 桌面 宠物 keyboard keys corgi desk pet gift',
  pixel: '像素 减压 玩具 fidget pixel toy',
  magnet: '冰箱贴 磁贴 家居 magnet home',
};
export const catalogueFilters = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'New' },
  { id: 'popular', label: 'Popular' },
  { id: 'ship', label: 'Ship to Home' },
  { id: 'print', label: 'Print at Home' },
];
export function matchingCreations(query, filter = 'all') {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return products
    .filter((p) => {
      const text = `${p.title} ${p.category} ${aliases[p.id] || ''}`.toLowerCase();
      return (
        (filter === 'all' || p.filters.includes(filter)) &&
        terms.every((term) => text.includes(term))
      );
    })
    .map((p) => p.id);
}
