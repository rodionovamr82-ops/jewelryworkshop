/* Рік у футері */
const yearNode = document.querySelector("span.year");
if (yearNode) {
    yearNode.textContent = new Date().getFullYear();
}