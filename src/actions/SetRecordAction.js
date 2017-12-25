const GetAuth = require("./GetAuth")
const { Op } = require("sequelize")

async function SetRecordAction(action, app) {
  const recordID = action.recordID
  const lastRecord = await app.model.record.findOne({
    where: { id: { [Op.eq]: recordID } },
  })
  const permission = await GetAuth(action, app, lastRecord)
  if (permission === "WRITE" && lastRecord) {
    await lastRecord.update({
      permission: action.permission,
      doc: action.doc,
    })
  } else if (permission === "WRITE") {
    await app.model.record.create({
      id: recordID,
      owner: action.authUser,
      permission: action.permission,
      doc: action.doc,
    })
  }
}

module.exports = SetRecordAction