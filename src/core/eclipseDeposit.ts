import {
    createPublicClient,
    createWalletClient,
    formatUnits,
    http,
    PrivateKeyAccount,
    SimulateContractReturnType,
} from 'viem';
import { Config, EclipseConfig } from '../config';
import { mainnet } from 'viem/chains';
import { printError, printInfo, printSuccess } from '../data/logger/logPrinter';
import { eclipseABI } from '../abis/eclipse';
// @ts-ignore
import bs58 from 'bs58'
import { delay } from '../data/helpers/delayer';
import { getValue } from '../data/utils/utils';
import { checkGwei } from '../data/helpers/gweiChecker';

export async function eclipseDeposit(account: PrivateKeyAccount, solanaAddress: string) {
    printInfo(`Выполняю депозит ETH на solana кошелек - ${solanaAddress}`)
    
    const decodedSolanaAddress = bs58.decode(solanaAddress);
    const destinationHex =
        '0x' + Buffer.from(decodedSolanaAddress).toString('hex');

    const client = createPublicClient({
        chain: mainnet,
        transport: Config.rpc == null ? http() : http(Config.rpc),
    });

    const walletClient = createWalletClient({
        chain: mainnet,
        transport: Config.rpc == null ? http() : http(Config.rpc),
    });

    let currentTry: number = 0,
        value = BigInt(0);

    while (currentTry <= Config.retryCount) {
        if (currentTry == Config.retryCount) {
            printError(
                `Не нашел баланс для депозита Eclipse. Превышено количество попыток - [${currentTry}/${Config.retryCount}]\n`,
            );
            return false;
        }

        value = await getValue(
            client,
            account.address,
            EclipseConfig.ethBridgeAmount.range,
            EclipseConfig.ethBridgeAmount.fixed,
            true,
        );

        printInfo(`Пытаюсь произвести deposit ${formatUnits(value, 18)} ETH`);

        currentTry++;

        if (value != null && value != BigInt(-1)) {
            currentTry = Config.retryCount + 1;
        } else {
            await delay(Config.delayBetweenAction.minRange, Config.delayBetweenAction.maxRange, false);
        }
    }
    
    await checkGwei();
    printInfo(`Буду производить deposit ${formatUnits(value, 18)} ETH на ${solanaAddress}`);

    const { request } = await client
        .simulateContract({
            address: '0x83cB71D80078bf670b3EfeC6AD9E5E6407cD0fd1',
            abi: eclipseABI,
            functionName: 'deposit',
            value: value,
            account: account,
            args: [destinationHex, value],
        })
        .then((result) => result as SimulateContractReturnType)
        .catch((e) => {
            printError(`Произошла ошибка во время выполнения модуля ${e}`);
            return { request: undefined };
        });

    if (request !== undefined) {
        const hash = await walletClient.writeContract(request).catch((e) => {
            printError(`Произошла ошибка во время выполнения модуля ${e}`);
            return false;
        });

        if (hash == false) {
            return false;
        }

        const url = `${mainnet.blockExplorers?.default.url + '/tx/' + hash}`;

        printSuccess(`Транзакция успешно отправлена. Хэш транзакции: ${url}\n`);

        return true;
    }
}