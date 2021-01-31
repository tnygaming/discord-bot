const Enmap = require("enmap");

const v1Roles = new Enmap({name :'rolesData'});
const v2Roles = new Enmap({name :'rolesDataV2'});
/**
 * Migration for the roles command's schema
 */
function migrateRolesToV2() {
  v1Roles.set('143146071814569986', [
    "tarkov",
    "tnydotatoes",
    "theboiis"]);

  console.log(`rolesV1-pre: ${v1Roles.export()}`);
  console.log(`rolesV2-pre: ${v2Roles.export()}`);

  //v1 formatted as guildId -> arr[roleNames]
  //v2 is a documentStore of arbitraryId -> {roleInfo} e.g. name, guildId, etc. 
  v1Roles.keyArray().forEach(guildId => {
    let roleNames = v1Roles.ensure(guildId, []);
    roleNames.forEach(roleName => {
      v2Roles.set(guildId + ":" + roleName, {
        name: roleName,
        guildId: guildId,
        description: null,
        channelId: null
      })
    })
  });

  
  console.log(`rolesV1-post: ${v1Roles.export()}`);
  console.log(`rolesV2-post: ${v2Roles.export()}`);
}

function rollbackMigrateRolesToV2() {
  v2Roles.clear();
}

module.exports.run = migrateRolesToV2;
module.exports.rollback = rollbackMigrateRolesToV2;