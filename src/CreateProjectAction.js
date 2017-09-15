import DatabaseService from "./DatabaseService";
import { getAuth } from "./AuthUtilities";
import Utilities from "./Utilities";

export default async function CreateProjectAction(action) {
  const auth = await getAuth(action.viewerUser, action.viewerSession);
  if (!auth) {
    throw "User is not authenticated";
  }
  //todo: verify project name, no slashes
  const userDoc = await DatabaseService.getDoc(action.viewerUser);
  const projects = userDoc.projects || {};
  if (projects[action.projectName]) {
    throw "Project with this name already exists!";
  }
  const creationTime = Math.floor(Date.now() / 1000);
  const newProject = {
    rootDoc: null,
    creationTime,
    updateTime: creationTime,
    isPublic: action.isPublic
  };
  await DatabaseService.writeDoc(action.viewerUser, {
    ...userDoc,
    projects: {
      ...projects,
      [action.projectName]: newProject
    }
  });
  return { projectName: action.projectName, isPublic: action.isPublic };
}
