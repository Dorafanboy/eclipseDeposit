import { delay } from './delayer';
import { createPublicClient, formatGwei, http, parseGwei } from 'viem';
import { printInfo } from '../logger/logPrinter';
import { mainnet } from 'viem/chains';
import { Config } from '../../config';

export async function checkGwei() {
    printInfo(`Выполняю проверку Gwei`);

    const client = createPublicClient({
        chain: mainnet,
        transport: Config.rpc == null ? http() : http(Config.rpc),
    });

    let gwei = await client.getGasPrice();

    while (gwei > parseGwei(Config.maxGwei.toString())) {
        if (gwei > parseGwei(Config.maxGwei.toString())) {
            printInfo(
                `Газ в сети Ethereum высокий: ${Number(formatGwei(gwei)).toFixed(1)} > ${Config.maxGwei}(from config)\n`,
            );
            await delay(Config.delayBetweenGweiCheck.minRange, Config.delayBetweenGweiCheck.maxRange, true);
        }

        gwei = await client.getGasPrice();
    }

    printInfo(`Гвей позволяет продолжить работу. Ethereum: ${Number(formatGwei(gwei)).toFixed(2)} gwei.`);
}
