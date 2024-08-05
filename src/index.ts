import { privateKeyToAccount } from 'viem/accounts';
import fs from 'fs';
import readline from 'readline';
import { printError, printInfo, printSuccess } from './data/logger/logPrinter';
import { delay } from './data/helpers/delayer';
import { Config } from './config';
import path from 'path';
import { eclipseDeposit } from './core/eclipseDeposit';
import * as console from 'node:console';

let account;

const privateKeysFilePath = path.join(__dirname, 'assets', 'private_keys.txt');
const solanaAddressesFilePath = path.join(__dirname, 'assets', 'solanaAddresses.txt');

const privateKeysPath = fs.createReadStream(privateKeysFilePath);
const solanaAddressesPath = fs.createReadStream(solanaAddressesFilePath);

async function main() {
    const rlPrivateKeys = readline.createInterface({
        input: privateKeysPath,
        crlfDelay: Infinity,
    });

    const rlSolanaAddresses = readline.createInterface({
        input: solanaAddressesPath,
        crlfDelay: Infinity,
    });

    const privateKeysData = fs.readFileSync(privateKeysFilePath, 'utf8');
    const solanaAddressesData = fs.readFileSync(solanaAddressesFilePath, 'utf8');

    const privateKeysCount = privateKeysData.split('\n').length;
    const solanaAddressesCount = solanaAddressesData.split('\n').length;

    if (privateKeysCount !== solanaAddressesCount) {
        printError(`Ошибка: количество строк в private_keys.txt (${privateKeysCount}) не равно количеству строк в solanaAddresses.txt (${solanaAddressesCount})`);
        return;
    }

    let index = 0;
    
    console.log('huy')

    const privateKeysIterator = rlPrivateKeys[Symbol.asyncIterator]();
    const solanaAddressesIterator = rlSolanaAddresses[Symbol.asyncIterator]();

    while (true) {
        const { value: privateKeyLine, done: privateKeyDone } = await privateKeysIterator.next();
        const { value: solanaAddressLine, done: solanaAddressDone } = await solanaAddressesIterator.next();

        if (privateKeyDone || solanaAddressDone) {
            printError(`Ошибка, количество строк в файлах не совпадает`);
            return;
        };

        try {
            if (privateKeyLine == '') {
                printError(`Ошибка, пустая строка в файле private_keys.txt`);
                return;
            }

            if (Config.isShuffleWallets) {
                printInfo(`Произвожу перемешивание только кошельков.`);
                await shuffleData();

                printSuccess(`Кошельки успешно перемешаны.\n`);
            }

            account = privateKeyToAccount(<`0x${string}`>privateKeyLine);
            printInfo(`Start [${index + 1}/${privateKeysCount} - ${account.address}]\n`);

            await eclipseDeposit(account, solanaAddressLine.trim());

            printSuccess(`Ended [${index + 1}/${privateKeysCount} - ${account.address}]\n`);

            fs.appendFile('src/assets/completed_accounts.txt', `${privateKeyLine}\n`, 'utf8', (err) => {
                if (err) {
                    printError(`Произошла ошибка при записи в файл: ${err}`);
                }
            });

            index++;

            if (index == privateKeysCount) {
                printSuccess(`Все аккаунты отработаны`);
                rlPrivateKeys.close();
                rlSolanaAddresses.close();
                return;
            }

            printInfo(`Ожидаю получение нового аккаунта`);
            await delay(Config.delayBetweenAccounts.minRange, Config.delayBetweenAccounts.maxRange, true);
        } catch (e) {
            printError(`Произошла ошибка при обработке строки: ${e}\n`);

            printInfo(`Ожидаю получение нового аккаунта`);
            await delay(Config.delayBetweenAccounts.minRange, Config.delayBetweenAccounts.maxRange, true);
            fs.appendFile('src/assets/uncompleted_accounts.txt', `${privateKeyLine}\n`, 'utf8', (err) => {
                if (err) {
                    printError(`Произошла ошибка при записи в файл: ${err}`);
                }
            });

            index++;
        }
    }
}

async function shuffleData() {
    try {
        const data = fs.readFileSync(privateKeysFilePath, 'utf8');
        const lines = data.split('\n');

        for (let i = lines.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [lines[i], lines[j]] = [lines[j], lines[i]];
        }

        await fs.writeFileSync(privateKeysFilePath, lines.join('\n'), 'utf8');
    } catch (error) {
        printError(`Произошла ошибка во время перемешивания данных: ${error}`);
    }
}

main();
