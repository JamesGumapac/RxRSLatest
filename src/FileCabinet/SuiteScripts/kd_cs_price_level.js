/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search'],
    /**
     * @param{record} record
     * @param{search} search
     */
    function (record, search) {


        /**
         * Function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @since 2015.2
         */
        // function fieldChanged(context) {
        //     var curRec = context.currentRecord;
        //     console.log('Cur Rec' + curRec)
        //     var sublistName = context.sublistId;
        //     var fieldName = context.fieldId
        //     log.debug('Test is starting')
        //     if (sublistName === 'item') {
        //         if(fieldName === "item"){
        //             log.debug('changing rate to 0')
        //             curRec.setCurrentSublistValue({
        //                 sublistId: 'item',
        //                 fieldId: 'price',
        //                 value: 8
        //             })
        //
        //
        //
        //         }
        //     }
        //
        // }
        function postSourcing(context){

            var curRec = context.currentRecord;
            console.log('Cur Rec' + curRec)
            var sublistName = context.sublistId;
            var fieldName = context.fieldId;
            if(sublistName === 'item' && fieldName === "item"){
                log.debug('TEST', 'price leve update')
                curRec.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'price',
                    value: 8
                })



            }
        }


        return {

            postSourcing: postSourcing
        };

    });
