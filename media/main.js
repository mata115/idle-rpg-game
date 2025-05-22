// プレイヤー強化定数
const BASE_WEAPON_POWER = 10;
const BASE_ARMOR_DEFENSE = 5;

// 強化倍率
const POWER_GROWTH = 1.0; // 攻撃・防御共通倍率
// 強化コスト
const BASE_UPGRADE_COST = 50;
const UPGRADE_COST_GROWTH = 1.2;


// エネミー 強化倍率
const ENEMY_GROWTH_RATE = 1.1;


const state = {
  player: {
    attack: 10,
    defense: 5,
    coins: 100,
    critRate: 0.2,
    weaponLevel: 0,
    armorLevel: 0,
	costLevel: 0
  },
  enemy: null,
  log: [],
};

const enemyTemplates = [
  {
    name: "スライム",
    baseHp: 20,
    baseAttack: 4,
    baseDefense: 1,
    critRate: 0.1,
    baseReward: 20,
  },
  {
    name: "ゴブリン",
    baseHp: 35,
    baseAttack: 7,
    baseDefense: 3,
    critRate: 0.15,
    baseReward: 30,
  },
  {
    name: "スケルトン",
    baseHp: 50,
    baseAttack: 9,
    baseDefense: 4,
    critRate: 0.2,
    baseReward: 40,
  },
  {
    name: "オーク",
    baseHp: 80,
    baseAttack: 12,
    baseDefense: 6,
    critRate: 0.25,
    baseReward: 50,
  },
];

function spawnEnemy() {
  const template = enemyTemplates[Math.floor(Math.random() * enemyTemplates.length)];
  const level = state.enemy ? state.enemy.level + 1 : 1;

  const multiplier = Math.pow(ENEMY_GROWTH_RATE, level - 1);

  state.enemy = {
    name: template.name,
    level,
    maxHp: Math.floor(template.baseHp * multiplier),
    hp: Math.floor(template.baseHp * multiplier),
    attack: Math.floor(template.baseAttack * multiplier),
    defense: Math.floor(template.baseDefense * multiplier),
    critRate: template.critRate,
    reward: Math.floor(template.baseReward * multiplier),
  };

  log(`敵が現れた: ${template.name}（Lv.${level}）`);
  updateUI();
}

function log(message) {
  state.log.unshift(message);
  const logElement = document.getElementById("battle-log");
  logElement.innerHTML = state.log.slice(0, 5).map(entry => `<p>${entry}</p>`).join('');
}

function updateUI() {
  document.getElementById("player-attack").innerText = state.player.attack;
  document.getElementById("player-defense").innerText = state.player.defense;
  document.getElementById("player-coins").innerText = state.player.coins;

  if (state.enemy) {
    document.getElementById("enemy-name").innerText = state.enemy.name;
	document.getElementById("enemy-level").innerText = state.enemy.level;
    document.getElementById("enemy-hp").innerText = `${state.enemy.hp} / ${state.enemy.maxHp}`;
    document.getElementById("enemy-attack").innerText = state.enemy.attack;
    document.getElementById("enemy-defense").innerText = state.enemy.defense;
    document.getElementById("enemy-crit").innerText = `${Math.floor(state.enemy.critRate * 100)}%`;
  }

  // 強化コスト表示
  const cost = getUpgradeCost();
  document.getElementById("upgrade-cost").innerText = `(次の強化コスト: ${cost}g)`;

  // ボタンの有効/無効切り替え
  const canAfford = state.player.coins >= cost;
  document.getElementById("upgrade-weapon").disabled = !canAfford;
  document.getElementById("upgrade-armor").disabled = !canAfford;
}

function calculatePlayerDamage(enemy) {
  const isCrit = Math.random() < state.player.critRate;
  let damage = state.player.attack;
  if (isCrit) {
    log("💥 クリティカルヒット！");
    damage *= 1.5;
  }
  return Math.max(Math.floor(damage - enemy.defense), 1);
}

function calculateEnemyDamage() {
  const isCrit = Math.random() < state.enemy.critRate;
  let damage = state.enemy.attack;
  if (isCrit) {
    log("⚠️ 敵のクリティカルヒット！");
    damage *= 1.5;
  }
  return Math.max(Math.floor(damage - state.player.defense), 0);
}

function battleTick() {
  if (!state.enemy) return;

  const damageToEnemy = calculatePlayerDamage(state.enemy);
  state.enemy.hp -= damageToEnemy;
  log(`▶ 敵に ${damageToEnemy} ダメージ`);

  if (state.enemy.hp <= 0) {
	state.player.coins += state.enemy.reward;
	log(`✅ ${state.enemy.name}（Lv.${state.enemy.level}）を倒した！ ${state.enemy.reward}g 獲得！`);
	spawnEnemy();
  } else {
    const damageToPlayer = calculateEnemyDamage();
    // state.player.coins = Math.max(state.player.coins - damageToPlayer, 0);
    log(`❗ ${state.enemy.name} の攻撃で ${damageToPlayer} ダメージ`);
  }

  updateUI();
}

function upgradeWeapon() {
  const cost = getUpgradeCost();
  if (state.player.coins >= cost) {
    const gain = Math.floor(BASE_WEAPON_POWER * Math.pow(POWER_GROWTH, state.player.weaponLevel));
    state.player.attack += gain;
    state.player.coins -= cost;
    state.player.weaponLevel++;
    state.player.costLevel++;
    log(`🗡 武器を強化！ 攻撃力 +${gain}（-${cost}g）`);
    updateUI();
  }
  else {
    log(`💸 コインが足りません！（必要: ${cost}g）`);
  }
}

function upgradeArmor() {
  const cost = getUpgradeCost();
  if (state.player.coins >= cost) {
    const gain = Math.floor(BASE_ARMOR_DEFENSE * Math.pow(POWER_GROWTH, state.player.armorLevel));
    state.player.defense += gain;
    state.player.coins -= cost;
    state.player.armorLevel++;
    state.player.costLevel++;
    log(`🛡 防具を強化！ 防御力 +${gain}（-${cost}g）`);
    updateUI();
  }
  else {
    log(`💸 コインが足りません！（必要: ${cost}g）`);
  }
}

function getUpgradeCost() {
  return Math.floor(BASE_UPGRADE_COST * Math.pow(UPGRADE_COST_GROWTH, state.player.costLevel));
}

document.getElementById("upgrade-weapon").addEventListener("click", upgradeWeapon);
document.getElementById("upgrade-armor").addEventListener("click", upgradeArmor);

spawnEnemy();
updateUI();
setInterval(battleTick, 2000); // 2秒ごとに戦闘
