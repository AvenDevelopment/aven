const { Op } = require("sequelize");
const { genHash, genSessionId, compareHash } = require("../Utilities");

async function AuthLoginAction(action, infra) {
  const user = await infra.model.user.findOne({
    where: {
      id: {
        [Op.eq]: action.userID,
      },
    },
  });
  const authMethod = await infra.model.authMethod.findOne({
    where: {
      primaryOwner: {
        [Op.eq]: action.userID,
      },
    },
  });
  if (!user || !authMethod) {
    throw {
      statusCode: 400,
      code: "INVALID_LOGIN",
      message: "Invalid secret or username!",
    };
  }
  if (authMethod.verificationKey) {
    throw {
      statusCode: 400,
      code: "INVALID_ACCOUNT_VERIFICATION",
      message: "User account is unverified!",
    };
  }
  if (!await compareHash(action.password, user.password)) {
    throw {
      statusCode: 400,
      code: "INVALID_LOGIN",
      message: "Invalid secret or username!",
    };
  }
  const sessionId = await genSessionId();
  const sessionSecret = await genSessionId();
  const logoutToken = await genSessionId();
  await infra.model.userSession.create({
    id: sessionId,
    user: action.userID,
    secret: await genHash(sessionSecret),
    logoutToken: await genHash(logoutToken),
    ip: "0.0.0.0", // uhhh, actually implement this
    authMethod: authMethod.id,
  });
  return {
    userID: action.userID,
    session: sessionId + "-" + sessionSecret,
    logoutToken: sessionId + "-" + sessionSecret,
  };
}

module.exports = AuthLoginAction;
