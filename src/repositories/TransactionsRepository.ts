import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();

    const balance = transactions.reduce(
      (accumulator, currentValue) => {
        switch (currentValue.type) {
          case 'income':
            accumulator.income += Number(currentValue.value);
            accumulator.total += Number(currentValue.value);
            break;
          case 'outcome':
            accumulator.outcome += Number(currentValue.value);
            accumulator.total -= Number(currentValue.value);
            break;
          default:
        }
        return accumulator;
      },
      {
        income: 0,
        outcome: 0,
        total: 0,
      },
    );

    return balance;
  }
}

export default TransactionsRepository;
