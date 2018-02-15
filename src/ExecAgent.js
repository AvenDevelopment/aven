const pathParse = require("path-parse");

const ExecAgent = (agent, platformDeps) => {
  async function exec(docID, recordID, context) {
    const doc = await agent.dispatch({
      type: "GetDocAction",
      docID,
      recordID,
    });
    context = context || [];
    console.log(
      "Exec",
      doc.value.type,
      context.map(({ docID, recordID, files, inheritRecord, fileName }) => ({
        docID,
        fileName,
        recordID,
        files: files.length,
        inheritRecord,
      })),
    );
    const moduleDoc = doc.value;
    if (moduleDoc.type !== "JSModule") {
      if (moduleDoc.type === "Directory") {
        const indexFile = moduleDoc.files.find(f => f.fileName === "index.js");
        if (indexFile) {
          const doc = await agent.dispatch({
            type: "GetDocAction",
            docID: indexFile.docID,
            recordID,
          });
          console.log("Handling index behavior!!");
          return await exec(indexFile.docID, indexFile.recordID, [
            context,
            {
              ...moduleDoc,
              recordID,
              fileName: indexFile.fileName,
              docID: indexFile.docID,
            },
          ]);
        }
      }
      return moduleDoc;
    }
    if (moduleDoc.error) {
      return moduleDoc.error;
    }

    const basicDeps = { ...platformDeps, Agent: agent };
    const basicDepNames = Object.keys(basicDeps);
    const remoteDeps = moduleDoc.dependencies.filter(
      dep => basicDepNames.indexOf(dep) === -1,
    );

    const deps = { ...basicDeps };
    const depsNotFound = [];

    await Promise.all(
      remoteDeps.map(async remoteDep => {
        let childDocID = null;
        context.find(parentContext => {
          if (parentContext.files) {
            return parentContext.files.find(file => {
              if (pathParse(file.fileName).name === remoteDep) {
                childDocID = file.docID;
                return true;
              }
            });
          }
          if (parentContext.inheritRecord) {
            console.log("FFF INHERIT!! ", parentContext.inheritRecord);
          }
        });
        let childRecordID = null;
        context.find(parentContext => {
          if (parentContext.recordID) {
            childRecordID = parentContext.recordID;
            return true;
          }
        });

        if (!childDocID) {
          childRecordID = remoteDep;
          const depModuleRecord = await agent.dispatch({
            type: "GetRecordAction",
            recordID: childRecordID,
          });
          if (depModuleRecord && depModuleRecord.docID) {
            childDocID = depModuleRecord.docID;
          }
        }
        if (!childDocID || !childRecordID) {
          depsNotFound.push(remoteDep);
          return;
        }
        const depModule = await agent.dispatch({
          type: "GetDocAction",
          recordID: childRecordID,
          docID: childDocID,
        });
        if (!depModule) {
          depsNotFound.push(remoteDep);
          return;
        }
        console.log("Executing dependency!", remoteDep);
        const executedDep = await exec(depModule, context);
        deps[remoteDep] = executedDep;
      }),
    );

    if (depsNotFound.length) {
      throw {
        statusCode: 404,
        message: "dependencies not found: " + depsNotFound.join(),
      };
    }
    let computedDoc = null;
    try {
      computedDoc = eval(moduleDoc.code)(deps);
    } catch (e) {
      computedDoc = null;
    }

    return computedDoc;
  }

  return {
    ...agent,
    exec,
  };
};

module.exports = ExecAgent;
