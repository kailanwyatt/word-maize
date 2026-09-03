// Static requires keep Metro/Expo asset discovery predictable.
export const wordMaizeAssets = {
  corn: {
    core: require('./corn/cob-core.png'),
    fullV2: require('./corn/cob-full-v2.png'),
    huskLeft: require('./corn/husk-left.png'),
    huskRight: require('./corn/husk-right.png'),
    huskBottom: require('./corn/husk-bottom.png'),
  },
  kernels: {
    normal: [
      require('./kernels/yellow/kernel-normal-01.png'),
      require('./kernels/yellow/kernel-normal-02.png'),
      require('./kernels/yellow/kernel-normal-03.png'),
    ],
    normalV2: require('./kernels/yellow/kernel-normal-v2.png'),
    selected: require('./kernels/yellow/kernel-selected.png'),
    hint: require('./kernels/yellow/kernel-hint.png'),
    emptySocket: require('./kernels/yellow/kernel-empty-socket.png'),
    emptySocketV2: require('./kernels/yellow/kernel-empty-socket-v2.png'),
    flying: require('./kernels/yellow/kernel-flying.png'),
  },
  props: {
    harvestBasket: require('./props/harvest-basket.png'),
    tractor: require('./props/tractor-mascot.png'),
    chest: require('./props/golden-chest.png'),
  },
  powerups: {
    scarecrow: require('./powerups/scarecrow.png'),
    butterBrush: require('./powerups/butter-brush.png'),
    cornPicker: require('./powerups/corn-picker.png'),
  },
  backgrounds: {
    gameplayFarm: require('./backgrounds/gameplay-farm.png'),
    gameplayFarmV2: require('./backgrounds/gameplay-farm-v2.png'),
    homeFarm: require('./backgrounds/home-farm.png'),
    worldMap: require('./backgrounds/world-map.png'),
    shopBarn: require('./backgrounds/shop-barn.png'),
  },
  ui: {
    coin: require('./ui/coin.png'),
    energy: require('./ui/energy.png'),
    logo: require('./ui/logo-v2.png'),
  },
  effects: {
    sparkleBurst: require('./effects/sparkle-burst.png'),
    kernelPop: require('./effects/kernel-pop.png'),
    butterTrail: require('./effects/butter-trail.png'),
  },
} as const;
