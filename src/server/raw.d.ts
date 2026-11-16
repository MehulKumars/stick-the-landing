// Vite's ?raw imports give a file's contents as a string.
declare module '*?raw' {
  const content: string;
  export default content;
}
