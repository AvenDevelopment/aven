const Sequelize = require("sequelize");

function createModel(sequelize) {
  const model = {};

  model.user = sequelize.define("User", {
    id: {
      type: Sequelize.STRING,
      primaryKey: true,
    },
    displayName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    password: {
      // checksum
      allowNull: false,
      type: Sequelize.STRING,
    },
  });

  model.authMethod = sequelize.define("AuthMethod", {
    id: {
      type: Sequelize.STRING,
      primaryKey: true,
    },
    type: {
      type: Sequelize.ENUM("PHONE", "EMAIL"),
      allowNull: false,
    },
    owner: {
      allowNull: false,
      type: Sequelize.STRING,
      references: {
        model: model.user,
        key: "id",
      },
    },
    primaryOwner: {
      unique: true,
      type: Sequelize.STRING,
      references: {
        model: model.user,
        key: "id",
      },
    },
    verificationKey: {
      // verification is incomplete unless this is empty!
      type: Sequelize.STRING,
    },
    verificationExpiration: {
      type: Sequelize.TIME,
    },
  });

  model.userToken = sequelize.define("UserToken", {
    user: {
      type: Sequelize.STRING,
      allowNull: false,
      references: {
        model: model.user,
        key: "id",
      },
    },
    expiryTime: {
      type: Sequelize.TIME,
    },
    permission: {
      allowNull: false,
      type: Sequelize.ENUM("WRITE", "READ", "NONE"),
    },
  });

  model.userSession = sequelize.define("UserSession", {
    id: {
      type: Sequelize.STRING,
      allowNull: false,
      primaryKey: true,
    },
    user: {
      allowNull: false,
      type: Sequelize.STRING,
      references: {
        model: model.user,
        key: "id",
      },
    },
    secret: {
      // checksum
      allowNull: false,
      type: Sequelize.STRING,
    },
    logoutToken: {
      // checksum
      allowNull: false,
      type: Sequelize.STRING,
    },
    ip: {
      allowNull: false,
      type: Sequelize.STRING,
    },
    authMethod: {
      allowNull: false,
      type: Sequelize.STRING,
      references: {
        model: model.authenticationMethod,
        key: "id",
      },
    },
  });

  model.doc = sequelize.define("Doc", {
    id: {
      type: Sequelize.STRING(40),
      allowNull: false,
      primaryKey: true,
    },
    value: {
      allowNull: false,
      type: Sequelize.JSONB,
    },
    size: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    uploader: {
      type: Sequelize.STRING,
      allowNull: false,
      references: {
        model: model.user,
        key: "id",
      },
    },
  });

  model.record = sequelize.define("Record", {
    id: {
      allowNull: false,
      type: Sequelize.STRING,
      primaryKey: true,
    },
    doc: {
      allowNull: true,
      type: Sequelize.STRING,
      references: {
        model: model.doc,
        key: "id",
      },
    },
    owner: {
      allowNull: false,
      type: Sequelize.STRING,
      references: {
        model: model.user,
        key: "id",
      },
    },
    permission: {
      allowNull: false,
      type: Sequelize.ENUM("PUBLIC", "PRIVATE"),
    },
  });

  // DocRecord:
  model.docRecord = sequelize.define("DocRecord", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    docId: {
      allowNull: false,
      type: Sequelize.STRING(40),
      references: {
        model: model.doc,
        key: "id",
      },
    },
    recordId: {
      allowNull: false,
      type: Sequelize.STRING,
      references: {
        model: model.record,
        key: "id",
      },
    },
  });
  model.doc.belongsToMany(model.record, {
    through: model.docRecord,
    foreignKey: "recordId",
  });
  model.record.belongsToMany(model.doc, {
    through: model.docRecord,
    foreignKey: "docId",
  });

  model.recordPermission = sequelize.define("RecordPermission", {
    record: {
      allowNull: false,
      type: Sequelize.STRING,
      references: {
        model: model.record,
        key: "id",
      },
    },
    user: {
      allowNull: false,
      type: Sequelize.STRING,
      references: {
        model: model.user,
        key: "id",
      },
    },
    permission: {
      allowNull: false,
      type: Sequelize.ENUM(
        "ADMIN",
        "WRITE",
        "READ",
        "EXECUTE",
        "WRITE_EXECUTE",
        "DENY",
      ),
    },
  });

  model.recordToken = sequelize.define("RecordToken", {
    record: {
      allowNull: false,
      type: Sequelize.STRING,
      references: {
        model: model.record,
        key: "id",
      },
    },
    secret: {
      // checksum
      allowNull: false,
      type: Sequelize.STRING,
    },
    expiryTime: {
      allowNull: false,
      type: Sequelize.TIME,
    },
    permission: {
      allowNull: false,
      type: Sequelize.ENUM("WRITE", "READ", "NONE"),
    },
  });

  return model;
}

module.exports = {
  createModel,
};
