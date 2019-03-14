module.exports = (function () {
  const mathUtil = {}

  mathUtil.noExponents = function (number) {
    const data = String(number).split(/[eE]/);
    if (data.length === 1) return data[0];

    let z = ''
    const sign = number < 0 ? '-' : ''
    const str = data[0].replace('.', '')
    let mag = Number(data[1]) + 1;

    if (mag < 0) {
      z = sign + '0.';
      while (mag++) z += '0';
      return z + str.replace(/^\-/, '');
    }
    mag -= str.length;
    while (mag--) z += '0';
    return str + z;
  }

  return mathUtil

})()