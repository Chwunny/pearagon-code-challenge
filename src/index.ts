import { createInterface } from "readline";
import axios from "axios";
import { red, blue } from "colorette";

const baseURL =
  "https://ejditq67mwuzeuwrlp5fs3egwu0yhkjz.lambda-url.us-east-2.on.aws/api/";

const reader = createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

interface BookResponseData {
  description: string;
  title: string;
  authors: number[];
}

class Controller {
  static async searchBookTitle(
    title: string
  ): Promise<BookResponseData | null> {
    return await axios
      .post(`${baseURL}books/search`, {
        title: title,
      })
      .then((res) => {
        const { description, title, authors }: BookResponseData = res.data;
        return {
          description,
          title,
          authors,
        };
      })
      .catch(() => {
        return null;
      });
  }
  static async getAuthorData(authorIDs: number[]): Promise<string[]> {
    let authorNames: string[] = [];
    for (const authorID of authorIDs) {
      await axios.get(`${baseURL}authors/${authorID}`).then((res) => {
        const { firstName, middleInitial, lastName } = res.data;
        const authorFullName = !middleInitial
          ? `${firstName} ${lastName}`
          : `${firstName} ${middleInitial} ${lastName}`;
        authorNames.push(authorFullName);
      });
    }
    return authorNames;
  }
}

const recursiveReadline = function (): void {
  reader.question("Search for a book? \n", async (input) => {
    const bookData = await Controller.searchBookTitle(input);
    if (bookData === null) {
      console.log(red("No book found."));
      return recursiveReadline();
    }

    if (!!bookData.authors.length) {
      const names = await Controller.getAuthorData(bookData.authors);
      console.log(blue(`${bookData.title}\n${bookData.description}`));
      console.log(blue(names.join(" \n")));
    } else {
      console.log(blue(`${bookData.title}\n${bookData.description}`));
    }

    return recursiveReadline();
  });
};

recursiveReadline();
