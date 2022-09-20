/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record'],
    function(record) {
        
        function beforeSubmit(context) {
            var invcRec = context.newRecord;

            for(var i = 0; i < invcRec.getLineCount('item'); i++){
                /*invcRec.selectLine({
                    sublistId: 'item',
                    line: i
                });*/

                var objSubRecord = invcRec.getSublistSubrecord({
                    sublistId: 'item',
                    fieldId: 'inventorydetail',
                    line: 0
                });
                log.debug('debug', JSON.stringify(objSubRecord));

                var invNum = objSubRecord.getSublistValue({
                    sublistId: 'inventoryassignment',
                    fieldId: 'numberedrecordid',
                    line: 0
                })
                log.debug('debug', 'invNum' + invNum);
                
            }
        }
        function afterSubmit(context) {
            if (context.type !== context.UserEventType.CREATE)
                return;
            var customerRecord = context.newRecord;
            if (customerRecord.getValue('salesrep')) {
                var call = record.create({
                    type: record.Type.PHONE_CALL,
                    isDynamic: true
                });
                call.setValue('title', 'Make follow-up call to new customer');
                call.setValue('assigned', customerRecord.getValue('salesrep'));
                call.setValue('phone', customerRecord.getValue('phone'));
                try {
                    var callId = call.save();
                    log.debug('Call record created successfully', 'Id: ' + callId);
                } catch (e) {
                    log.error(e.name);
                }
            }
        }
        return {
            beforeSubmit: beforeSubmit/*,
            afterSubmit: afterSubmit*/
        };
    });