/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([],

function() {
    
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    function pageInit(scriptContext) {

    }
    function customButton() {

        window.open('https://6816904.app.netsuite.com/core/media/media.nl?id=4939&c=6816904&h=bYefmqublc2G4Ru7VkC6e4jZwwxM8TGsNMSJ1K10taKNo9u4&id=4939&_xt=.csv&_xd=T&fcts=20211115075913');
    }


    return {
        pageInit: pageInit,
        customButton: customButton

    };
    
});
