import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';

class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const transactionToDelete = await transactionRepository.findOne(id);
    if (!transactionToDelete) throw new AppError('Transaction does not exists');

    await transactionRepository.remove(transactionToDelete);
  }
}

export default DeleteTransactionService;
