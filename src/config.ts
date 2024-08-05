import { IBridgeRange, IDelayRange, IFixedRange } from './data/utils/interfaces';

export class Config {
    public static readonly isShuffleWallets: boolean = true; // перемешивать ли строки в текстовом файле для приватных ключей
    public static readonly retryCount: number = 15; // сколько попыток будет, чтобы получить новую сеть, значение для бриджа
    public static readonly maxGwei = 3; // до какого гвея будет использоваться скрипт
    public static readonly delayBetweenGweiCheck: IDelayRange = { minRange: 0.3, maxRange: 1 }; // задержка перед получением нового гвея (в минутах)
    public static readonly delayBetweenAction: IDelayRange = { minRange: 2.2, maxRange: 4 }; // задержка между действиями (в секундах) в случае ошибки
    public static readonly delayBetweenAccounts: IDelayRange = { minRange: 37, maxRange: 45 }; // задержка между аккаунтами (в минутах)
    public static readonly rpc = 'https://rpc.ankr.com/eth';
}

export class EclipseConfig {
    public static readonly ethBridgeAmount: { range: IBridgeRange; fixed: IFixedRange } = {
        range: { minRange: 0.002, maxRange: 0.002169 },
        fixed: { minRange: 6, maxRange: 8 },
    }; // сколько депозитить eth в eclipse(от 0.002), fixed - количество символов после запятой, т.е если выпадет рандомное количество range = 0.00001552254241 fixed будет 7
}
