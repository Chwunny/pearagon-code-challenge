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

// Cases:
// - A book with no author is found => return book title and book description
// - A book with author(s) is found => return book title, description, and author(s)
// - No book is found => return "No book found."

// Steps:
// 1. Accept input from user (Book Title)
// 2. Verify which of the above cases was met and respond accordingly
// 3. If there is more than one author their names must be parsed and formatted properly
// 4. Loop recursively

class Controller {
  // Define a method that can be used to search book titles, it must return the book title, description, and an array of the authors IDs, if no data is found return
  // null so that the recursive function can handle logic flow accordingly
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
  // Define a method that can be used to search author names by author ID, it must return the author names in plain english format
  static async getAuthorData(authorIDs: number[]): Promise<string[]> {
    let authorNames: string[] = [];
    for (const authorID of authorIDs) {
      // loop through the array of author IDs
      await axios.get(`${baseURL}authors/${authorID}`).then((res) => {
        // make an async request to :authorId endpoint
        const { firstName, middleInitial, lastName } = res.data; // destructure the names singular parts
        // If the author has a middle name we return all 3 parts with a single space inbetween them, otherwise we return just the first and last name with a space between
        // we do it this way to avoid having a name returned as "First undefined Last"
        const authorFullName = !middleInitial
          ? `${firstName} ${lastName}`
          : `${firstName} ${middleInitial} ${lastName}`;
        authorNames.push(authorFullName); // push the formatted name into an array so they can all be returned together after the loop is complete
      });
    }
    return authorNames;
  }
}

const recursiveReadline = function (): void {
  reader.question("Search for a book? \n", async (input) => {
    const bookData = await Controller.searchBookTitle(input);
    if (bookData === null) {
      // If the controller function returned null it means there was no data found, so we can error handle and loop
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

    // Seperate the above cases so that all of the data is displayed at once rather than with a delay. If we log the title and description independently then there is
    // some delay between the the title/desc being logged and the author names being logged ( since we're waiting for up to two more async calls )

    return recursiveReadline(); // loop again
  });
};

recursiveReadline(); // Intitial invocation of our main function
