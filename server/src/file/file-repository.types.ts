export interface FileRepository {
  listFiles(dir: string): Promise<string[]>;
  readFile(filename: string): Promise<string>;
  writeFile(filename: string, content: string): Promise<void>;
}
