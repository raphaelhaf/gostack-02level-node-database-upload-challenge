import csvParse from 'csv-parse';
import fs from 'fs';

import { getRepository, getCustomRepository, In, Not } from 'typeorm';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    const readCSVStream = fs.createReadStream(filePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const transactions: CSVTransaction[] = [];

    parseCSV.on('data', line => {
      const [title, type, value, category] = line;
      transactions.push({ title, type, value, category });
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    const categoriesTitleToImport = transactions.map(
      transaction => transaction.category,
    );

    const existentCategories = await categoriesRepository.find({
      where: { title: In(categoriesTitleToImport) },
    });

    const existentCategoriesTitle = existentCategories.map(
      category => category.title,
    );

    const categoriesTitleToInclude = categoriesTitleToImport
      .filter(category => !existentCategoriesTitle.includes(category))
      .filter((value, index, arr) => arr.indexOf(value) === index);

    const categoriesToInclude = await categoriesRepository.create(
      categoriesTitleToInclude.map(title => ({ title } as Category)),
    );
    await categoriesRepository.save(categoriesToInclude);

    const allCategories = [...categoriesToInclude, ...existentCategories];

    const createTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: allCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionsRepository.save(createTransactions);

    await fs.promises.unlink(filePath);

    return createTransactions;
  }
}

export default ImportTransactionsService;
