/*
  Class for building ascii tables

  Example:
    +------------+----------+
    | Header 1   | Header 2 |
    +------------+----------+
    | hello      | foo      |
    | goodbye    | bar      |
    +------------+----------+
*/
class TableBoi {
  /*
   * @param headers (required) list of column headers
   */
  constructor(headers) {
    this.rows = [headers];
  }

  /*
   * @param row (required) list of row values for each column, must be same length as headers
   */
  addRow(row) {
    this.rows.push(row);
  }

  /*
   * returns string representing table
   */
  getTableString() {
    // calculate max-length for each column
    let colLengths = new Array(this.rows[0].length).fill(0);
    this.rows.forEach(function (row) {
      row.forEach(function (val, index) {
        colLengths[index] = Math.max(val.length, colLengths[index])
      });
    });

    // generate horizontal separator
    const horizontalSeparator = getHorizontalSeparatorStr(colLengths);

    // generate each row and concatenate together
    let bodyStr = "";
    this.rows.forEach(function (row, index) {
      bodyStr += getRowStr(colLengths, row, "|", " ");

      // add horizontal separarator after header row
      if(index == 0) {
        bodyStr += horizontalSeparator;
      }
    });

    return horizontalSeparator + bodyStr + horizontalSeparator;
  }
}

function getRowStr(colLengths, rowVals, separator, filler) {
  // get list of row values with necessary filler added
  const spacedVals = rowVals.map(function(val, index) {
    return filler + val + filler.repeat(colLengths[index] - val.length) + filler;
  });

  // concatenate values and add separators
  return separator + spacedVals.join(separator) + separator + "\n";
}

function getHorizontalSeparatorStr(colLengths) {
  return getRowStr(colLengths, new Array(colLengths.length).fill(""), "+", "-");
}

module.exports = TableBoi;
