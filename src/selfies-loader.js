/**
 * Wrapper to load selfies-js ES module in CommonJS context
 */

let selfiesModule = null;

async function loadSelfiesJS() {
    if (!selfiesModule) {
        try {
            // Use dynamic import to load ES module
            selfiesModule = await import('selfies-js');
        } catch (error) {
            console.error('Failed to load selfies-js:', error);
            throw error;
        }
    }
    return selfiesModule;
}

// Lazy-load wrapper functions
const createLazyProxy = (fnName) => {
    return async (...args) => {
        const module = await loadSelfiesJS();
        return module[fnName](...args);
    };
};

// Export lazy-loaded functions
module.exports = {
    parse: (...args) => loadSelfiesJS().then(m => m.parse(...args)),
    resolve: (...args) => loadSelfiesJS().then(m => m.resolve(...args)),
    decode: (...args) => loadSelfiesJS().then(m => m.decode(...args)),
    getMolecularWeight: (...args) => loadSelfiesJS().then(m => m.getMolecularWeight(...args)),
    getFormula: (...args) => loadSelfiesJS().then(m => m.getFormula(...args)),
    loadSelfiesJS
};
