import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'fast-csv';

const test = () => {
  fs.createReadStream(
    path.resolve(__dirname, 'etc', 'FakeNameGenerator.com_145b5e3e.csv'),
  )
    .pipe(csv.parse({ headers: true }))
    .on('error', (error) => console.error(error))
    .on('data', (row) => console.log(row))
    .on('end', (rowCount: number) => console.log(`Parsed ${rowCount} rows`));
};

test();
