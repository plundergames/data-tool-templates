import {mkdir, readdir, readFile, writeFile} from "fs/promises";
import {join} from "path";

const rootDir = "./templates";
const buildDir = "./build";
const allTemplatesFile = join(buildDir, "all.json");

const getDirectories = async source =>
  (await readdir(source, {withFileTypes: true}))
    .filter(dirent => dirent.isDirectory())
    .map(({name}) => name);

const getFiles = async source =>
  (await readdir(source, {withFileTypes: true}))
    .filter(dirent => dirent.isFile())
    .map(({name}) => name);

const categories = await getDirectories(rootDir);

async function getPreviews(category) {
  const categoryPath = join(rootDir, category);
  const templateNames = await getFiles(categoryPath);
  const buildCategoryPath = join(buildDir, category);
  await mkdir(buildCategoryPath, {recursive: true});

  const templateProms = templateNames.map(async (templateName) => {
    const templatePath = join(categoryPath, templateName);
    const buildTemplatePath = join(buildCategoryPath, templateName);

    const templateFile = await readFile(templatePath, "utf8");
    const templateJson = JSON.parse(templateFile);
    await writeFile(buildTemplatePath, JSON.stringify(templateJson));

    const url = `${category}/${templateName}`;
    return {
      name: templateJson.name,
      url,
      steps: templateJson.steps || null
    };
  });

  const templates = await Promise.all(templateProms);
  return {
    group: category,
    templates,
  }
}

const result = (await Promise.all(
  categories.map(category => getPreviews(category))
));

await writeFile(allTemplatesFile, JSON.stringify(result));
