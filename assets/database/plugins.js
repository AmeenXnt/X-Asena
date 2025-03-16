const fs = require("fs");
const path = require("path");
const { default: got } = require("got");
const config = require("../../config");
const { DataTypes } = require("sequelize");

const PluginDB = config.DATABASE.define("Plugin", {
  name: { type: DataTypes.STRING, allowNull: false },
  url: { type: DataTypes.TEXT, allowNull: false },
});

async function getandRequirePlugins(conn) {
  let plugins = await PluginDB.findAll();
  plugins = plugins.map((plugin) => plugin.dataValues);

  plugins.forEach((plugin) => {
    try {
      got(plugin.url).then(async (res) => {
        eval(res.body); // Load external plugin from URL
      });
    } catch (error) {
      console.error("Failed to load plugin:", plugin.name, error);
    }
  });

  // ✅ NEW: Auto-load local plugins from assets/plugins/
  const pluginsPath = path.join(__dirname, "../plugins");
  let pluginFiles = fs.readdirSync(pluginsPath).filter((file) => file.endsWith(".js"));

  pluginFiles.forEach((file) => {
    require(path.join(pluginsPath, file));
  });

  console.log(`✅ Loaded ${pluginFiles.length} Plugins!`);

  // ✅ NEW: Send a message to the bot owner with the plugin count
  
  return pluginFiles.length;
}

module.exports = { getandRequirePlugins };
/*const { default: got } = require("got");
const config = require("../../config");
const { DataTypes } = require("sequelize");

const PluginDB = config.DATABASE.define("Plugin", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  url: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
});

async function installPlugin(adres, file) {
  const existingPlugin = await PluginDB.findOne({ where: { url: adres } });

  if (existingPlugin) {
    return false;
  } else {
    return await PluginDB.create({ url: adres, name: file });
  }
}

async function removePlugin(name) {
  const existingPlugin = await PluginDB.findOne({ where: { name: name } });

  if (existingPlugin) {
    await existingPlugin.destroy();
    return true;
  } else {
    return false;
  }
}

async function getandRequirePlugins() {
  let plugins = await PluginDB.findAll();
  plugins = plugins.map((plugin) => plugin.dataValues);
  plugins.forEach((plugin) => {
    try {
      got(plugin.url).then(async (res) => {
        require("fs").writeFileSync(
          __basedir + "/assets/plugins/" + plugin.name + ".js",
          res.body
        );
        require(__basedir + "/assets/plugins/" + plugin.name);
        console.log("Installed plugin:", plugin.name);
      });
    } catch (e) {
      console.error(e);
    }
  });
}

module.exports = { PluginDB, installPlugin, getandRequirePlugins };*/
