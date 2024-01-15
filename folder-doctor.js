const fs = require("fs");
const path = require("path");
const ignore = require("ignore");
const { spawn } = require("child_process");

// ANSI escape code for green color
const colors = {
  reset: "\x1b[0m",
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  brightGreen: "\x1b[32;1m",
  brightCyan: "\x1b[36;1m",
  white: "\x1b[37m",
};

function copyFileSync(source, target) {
  try {
    const targetFile = target;
    const isDir = fs.lstatSync(source).isDirectory();

    if (isDir && !fs.existsSync(targetFile)) {
      fs.mkdirSync(targetFile);
    }

    fs.writeFileSync(targetFile, fs.readFileSync(source));
    console.log(`${colors.green}Copied: ${source} -> ${target}${colors.reset}`);
  } catch (err) {
    console.error(`${colors.red}Error copying file ${source}: ${err.message}${colors.reset}`);
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

    console.log(`${colors.brightGreen}Folder copied: ${source} -> ${target}${colors.reset}`);
  } catch (err) {
    console.error(`${colors.red}Error copying folder ${source}: ${err.message}${colors.reset}`);
  }
}

function watchFolder(srcPath, destPath, ignoreFilter) {
  try {
    copyFolderSync(srcPath, destPath, ignoreFilter);

    fs.watch(srcPath, { recursive: true }, (eventType, filename) => {
      if (eventType === "change" || eventType === "rename") {
        console.log(`${colors.yellow}Detected change: ${filename}${colors.reset}`);

        copyFolderSync(srcPath, destPath, ignoreFilter);
      }
    });

    console.log(`${colors.brightCyan}Watching for changes in: ${srcPath}${colors.reset}`);
  } catch (err) {
    console.error(`${colors.red}Error watching folder: ${err.message}${colors.reset}`);
  }
}

// Read and parse .gitignore file
function readGitIgnore(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const ignoreFilter = ignore().add(content);
    return ignoreFilter;
  } catch (err) {
    console.error(`${colors.red}Error reading .gitignore file: ${err.message}${colors.reset}`);
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
