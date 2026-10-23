import SecureLS from "secure-ls";

export const secureSessionStorage = (key) => {
    const ls = new SecureLS.default({
        encodingType: "aes",
        encryptionSecret: key, // 必须32位字符
        isCompression: false,
        storage: sessionStorage
    });

    return {
        setItem(key, value) {
            ls.set(key, value);
        },
        getItem(key) {
            return ls.get(key);
        },
        removeItem(key) {
            ls.remove(key);
        },
    };
};
