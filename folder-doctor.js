const fs = require("fs");
const path = require("path");
const ignore = require("ignore");
const { spawn } = require("child_process");

// ANSI escape code for green color
const greenColor = "\x1b[32m";
const resetColor = "\x1b[0m";

function copyFileSync(source, target) {
  try {
    const targetFile = target;
    const isDir = fs.lstatSync(source).isDirectory();

    if (isDir && !fs.existsSync(targetFile)) {
      fs.mkdirSync(targetFile);
    }

    fs.writeFileSync(targetFile, fs.readFileSync(source));
    console.log(`${greenColor}Copied: ${source} -> ${target}${resetColor}`);
  } catch (err) {
    console.error(`${greenColor}Error copying file ${source}: ${err.message}${resetColor}`);
  }
}

function copyFolderSync(source, target, ignoreFilter) {
  try {
    if (!fs.existsSync(target)) {
      fs.mkdirSync(target);
    }

    fs.readdirSync(source).forEach((file) => {
      const sourcePath = path.join(source, file);
      const targetPath = path.join(target, file);

      if (!ignoreFilter.ignores(path.relative(source, sourcePath))) {
        if (fs.lstatSync(sourcePath).isDirectory()) {
          copyFolderSync(sourcePath, targetPath, ignoreFilter);
        } else {
          copyFileSync(sourcePath, targetPath);
        }
      }
    });

    console.log(`${greenColor}Folder copied: ${source} -> ${target}${resetColor}`);
  } catch (err) {
    console.error(`${greenColor}Error copying folder ${source}: ${err.message}${resetColor}`);
  }
}

function watchFolder(srcPath, destPath, ignoreFilter) {
  try {
    copyFolderSync(srcPath, destPath, ignoreFilter);

    fs.watch(srcPath, { recursive: true }, (eventType, filename) => {
      if (eventType === "change" || eventType === "rename") {
        console.log(`${greenColor}Detected change: ${filename}${resetColor}`);

        copyFolderSync(srcPath, destPath, ignoreFilter);
      }
    });

    console.log(`${greenColor}Watching for changes in: ${srcPath}${resetColor}`);
  } catch (err) {
    console.error(`${greenColor}Error watching folder: ${err.message}${resetColor}`);
  }
}

// Read and parse .gitignore file
function readGitIgnore(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const ignoreFilter = ignore().add(content);
    return ignoreFilter;
  } catch (err) {
    console.error(`${greenColor}Error reading .gitignore file: ${err.message}${resetColor}`);
    return null;
  }
}

const srcPath = "../../storefront/my-medusa-admin/node_modules/@medusajs/admin-ui";
const destPath = "../../storefront/admin-ui";
const gitIgnorePath = "../../storefront/admin-ui/.gitignore";

const ignoreFilter = readGitIgnore(gitIgnorePath);

if (ignoreFilter) {
  watchFolder(srcPath, destPath, ignoreFilter);
}

// Keep the application running
process.stdin.resume();
