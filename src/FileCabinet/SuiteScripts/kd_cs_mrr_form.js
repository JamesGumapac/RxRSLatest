/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * Company: Elewana
 * Date Created: 8/13/2022
 * Version: 1.1
 * Change log: Added message on user to diplay which fee will be used in the Master Return Request
 */
define(['N/record', 'N/search', 'N/currentRecord','N/ui/message'],
    /**
     * @param{record} record
     * @param{search} search
     * @param{currentRecord} currentRecord
     * @param{message} message
     */
    function (record, search, currentRecord,message) {

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
        function fieldChanged(scriptContext) {

        }

        /**
         * Function to be executed when field is slaved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         *
         * @since 2015.2
         */
        function postSourcing(scriptContext) {

        }

        /**
         * Function to be executed after sublist is inserted, removed, or edited.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @since 2015.2
         */
        function sublistChanged(scriptContext) {

        }

        /**
         * Function to be executed after line is selected.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @since 2015.2
         */
        function lineInit(scriptContext) {

        }

        /**
         * Validation function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @returns {boolean} Return true if field is valid
         *
         * @since 2015.2
         */
        function validateField(scriptContext) {

        }

        /**
         * Validation function to be executed when sublist line is committed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateLine(scriptContext) {

        }

        /**
         * Validation function to be executed when sublist line is inserted.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateInsert(scriptContext) {

        }

        /**
         * Validation function to be executed when record is deleted.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateDelete(scriptContext) {

        }

        /**
         * Validation function to be executed when record is saved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @returns {boolean} Return true if record is valid
         *
         * @since 2015.2
         */
        function saveRecord(scriptContext) {

        }
        function showMessage(quantityBasedFee){
            console.log('quantityBasedFee',quantityBasedFee)
            if(quantityBasedFee === 'T'){
                var infoMessage = message.create({
                    title: 'INFORMATION',
                    message: 'SETTING MRR FEE BASED ON QUANTITY',
                    type: message.Type.INFORMATION,

                });
                infoMessage.show()
            }else{
                var infoMessage = message.create({
                    title: 'INFORMATION',
                    message: 'SETTING MRR FEE BASED ON WEIGHT',
                    type: message.Type.INFORMATION,

                });
                infoMessage.show()
            }
        }

        function setTimeout(aFunction, milliseconds){
            var date = new Date();
            date.setMilliseconds(date.getMilliseconds() + milliseconds);
            while(new Date() < date){
            }

            return aFunction();
        }
        function mrrSelectFee() {
            let objRecord = currentRecord.get();
            let mrrId = objRecord.id
            let quantityBasedFee = objRecord.getValue("custrecord_kd_use_quantity_based_fee")
            console.log('id', mrrId)
            let mrrRec = record.load({
                type: 'customrecord_kod_masterreturn',
                id: mrrId,
                isDynamic: true
            })
            let useQuantityBasedFee = mrrRec.getValue('custrecord_kd_use_quantity_based_fee')

            console.log('useQuantityBasedFee', useQuantityBasedFee)
            if (mrrRec) {
                //when button is clicked set the useQuantityBasedFee to false or vice versa
                if (useQuantityBasedFee === 'T' || useQuantityBasedFee === true) {
                    mrrRec.setValue('custrecord_kd_use_weight_based_fee', true)
                    mrrRec.setValue('custrecord_kd_use_quantity_based_fee', false)


                } else {
                    mrrRec.setValue('custrecord_kd_use_weight_based_fee', false)
                    mrrRec.setValue('custrecord_kd_use_quantity_based_fee', true)

                }
            }
            mrrNewId = mrrRec.save({
                ignoreMandatoryFields: true
            })
            if(mrrNewId){
                showMessage(quantityBasedFee)
                location.reload();


            }



        }

        return {
            mrrSelectFee: mrrSelectFee
        };

    });
