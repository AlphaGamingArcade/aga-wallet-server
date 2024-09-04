const CryptoJS = require('crypto-js');

exports.encryptMnemonic = (mnemonic, password) => {
    return CryptoJS.AES.encrypt(mnemonic, password).toString();
}
exports.decryptMnemonic = (encryptedMnemonic, password) => {
    const bytes = CryptoJS.AES.decrypt(encryptedMnemonic, password);
    return bytes.toString(CryptoJS.enc.Utf8);
}
