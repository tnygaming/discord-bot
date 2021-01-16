const magic = /[^\s"]+|"([^"]*)"/gi;

/**
 * discord.js args are strictly split by space. This handles the scenario where you want to have 
 * multi word arguments wrapped by quotes. e.g.
 *    "some long first input" second "third input" 
 *    becomes: 
 *      ["some long first input", "second", "third input"]
 * 
 * @param {args from a discord.js command} args 
 */
module.exports.parseArgs = function parseArgs(args) {
  var result = [];
  
  do {
      //Each call to exec returns the next regex match as an array
      var match = magic.exec(args.join(" "));
      if (match != null)
      {
          //Index 1 in the array is the captured group if it exists
          //Index 0 is the matched text, which we use if no captured group exists
          result.push(match[1] ? match[1] : match[0]);
      }
  } while (match != null);
  return result;
}
