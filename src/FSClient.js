const fetch = require("node-fetch");
const fileType = require("file-type");
const { promisify } = require("bluebird");
const fs = require("fs-extra");
const stringify = require("json-stable-stringify");
const { join, basename } = require("path");
const { digest } = require("../src/Utilities");

const isBinaryFile = promisify(require("isbinaryfile"));

// babel stufs:
const babel = require("babel-core");
const presetEs2015 = require("babel-preset-es2015");
const presetStage0 = require("babel-preset-stage-0");
const presetReact = require("babel-preset-react");

async function FSClient(context) {
  const { dispatch, authUser, authSession } = context;
  const uploadedFiles = context.uploadedFiles || (context.uploadedFiles = {});

  async function readJSModuleValue(path) {
    const source = await fs.readFile(path, {
      encoding: "utf8",
    });
    let dependencies = null;
    const parsedBabel = babel.transform(source, {
      sourceMaps: true,
      presets: [presetEs2015, presetStage0, presetReact],
      plugins: [
        ({ parse, traverse }) => ({
          visitor: {
            ArrowFunctionExpression(path) {
              if (!dependencies) {
                const input = path.node.params[0];
                dependencies = input.properties.map(a => {
                  return a.value.name;
                });
              }
            },
          },
        }),
      ],
    });
    const moduleData = {
      dependencies,
      type: "JSModule",
      code: parsedBabel.code,
      map: parsedBabel.map,
      source,
    };
    return moduleData;
  }

  async function readFileValue(path) {
    const stat = await fs.lstat(path);
    let fileValue = null;
    if (basename(path).match(/.js$/)) {
      return await readJSModuleValue(path);
    }
    if (stat.isDirectory()) {
      const fileNames = await fs.readdir(path);
      const files = await Promise.all(
        fileNames.sort().map(async fileName => {
          const filePath = join(path, fileName);
          const docID = await checksumPath(filePath);
          return { docID, fileName };
        }),
      );
      return {
        type: "Directory",
        files,
      };
    } else {
      const file = await fs.readFile(path);
      const isBinary = await isBinaryFile(file, file.length);
      if (isBinary) {
        fileValue = { type: "Buffer", value: file.toString("base64") };
      } else {
        try {
          fileValue = JSON.parse(file.toString());
        } catch (e) {
          fileValue = { type: "String", value: file.toString() };
        }
      }
    }
    return fileValue;
  }

  async function checksumPath(path) {
    const fileValue = await readFileValue(path);
    const id = digest(stringify(fileValue));
    return id;
  }

  async function putPath(path, recordID) {
    const fileValue = await readFileValue(path);

    if (fileValue.type === "Directory") {
      await Promise.all(
        fileValue.files.map(async file => {
          const filePath = join(path, file.fileName);
          await putPath(filePath, recordID);
        }),
      );
    }

    const docID = digest(stringify(fileValue));

    if (uploadedFiles[recordID + docID]) {
      return {
        recordID,
        docID,
      };
    }

    const createDoc = await dispatch({
      type: "CreateDocAction",
      recordID,
      docID,
      authSession,
      authUser,
      value: fileValue,
    });
    uploadedFiles[recordID + docID] = true;
    return {
      recordID,
      docID,
    };
  }

  async function uploadPath(path, recordID) {
    let record = await dispatch({
      type: "GetRecordAction",
      recordID,
      authSession,
      authUser,
    });
    if (!record.id) {
      record = await dispatch({
        type: "SetRecordAction",
        recordID,
        authSession,
        authUser,
        docID: null,
        permission: "PUBLIC",
        owner: authUser,
      });
    }
    const putResult = await putPath(path, recordID);
    await dispatch({
      type: "SetRecordAction",
      recordID,
      authSession,
      authUser,
      doc: putResult.docID,
      permission: "PUBLIC",
      owner: authUser,
    });

    return {
      recordID,
      docID: putResult.docID,
    };
  }

  async function getPath(path, recordID, docID) {
    const doc = await dispatch({
      type: "GetDocAction",
      recordID,
      docID,
      authUser,
      authSession,
    });
    const pathExists = await fs.pathExists(path);
    if (pathExists) {
      throw "Not supported yet! Rm path before downloading, or fix this code";
    }
    if (doc.value.type === "Directory") {
      await fs.mkdir(path);
      await Promise.all(
        doc.value.files.map(async file => {
          const filePath = join(path, file.fileName);
          await getPath(filePath, recordID, file.docID);
        }),
      );
    } else if (doc.value.type === "Buffer") {
      await fs.writeFile(path, new Buffer(doc.value.value, "base64"));
    } else if (doc.value.type === "String") {
      await fs.writeFile(path, doc.value.value);
    } else {
      await fs.writeFile(path, stringify(doc.value));
    }
  }

  async function downloadPath(path, recordID) {
    const record = await dispatch({
      type: "GetRecordAction",
      recordID,
      authSession,
      authUser,
    });
    if (!record || !record.doc) {
      throw "Cannot find record!!:!?"; // todo, consistent error handling on client
    }
    await getPath(path, recordID, record.doc);
  }

  return {
    checksumPath,
    putPath,
    uploadPath,
    getPath,
    downloadPath,
    close: () => {},
  };
}

module.exports = FSClient;
