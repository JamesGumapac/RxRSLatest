/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/error', 'N/search'],
function(record, error, search) {  
    var REC_PAYMENT_SCHEDULE = 'customrecord_kd_payment_schedule';
    var FLD_PAYSCHED_MIN_DAYS = 'custrecord_kd_paysched_min_days';
    var FLD_PAYSCHED_MAX_DAYS = 'custrecord_kd_paysched_max_days';
    function isOverlap(paySchedId, minDays, maxDays){
        var paySchedSearch = search.create({
            type: REC_PAYMENT_SCHEDULE,
            columns: [search.createColumn({
                name: 'internalid',
                summary: search.Summary.COUNT
            })],
            filters: [{
                name: FLD_PAYSCHED_MIN_DAYS,
                operator: 'lessthanorequalto',
                values: [maxDays]
            },{
                name: FLD_PAYSCHED_MAX_DAYS,
                operator: 'greaterthanorequalto',
                values: [minDays]
            }]
        });
        if(paySchedId != null && paySchedId != ''){
            log.debug('payment edited', 'adding internal id filter: ' + paySchedId);
            paySchedSearch.filters.push(
                search.createFilter({
                name: 'internalid',
                operator: search.Operator.NONEOF,
                values: [paySchedId]
            }));
        }
        var rs = paySchedSearch.run().getRange(0,1);
        var paySchedCount = rs[0].getValue({name: 'internalid', summary: search.Summary.COUNT});
        log.debug('isOverlap', 'paySched COUNT: ' + paySchedCount);
        if(paySchedCount > 0){
            return true;
        }
        return false;
    }
    function beforeLoad(context) {
        var paySchedRec = context.newRecord;
        
        if (paySchedRec.id > 0 && paySchedRec.id < 10) {
            if (context.type == context.UserEventType.EDIT) {
                throw error.create({
                    name: 'ERR_PYMNT_SCHED', 
                    message: 'You cannot edit this Payment Schedule record.',
                    notifyOff: false
                }).message;
            } else if (context.type == context.UserEventType.DELETE) {
                throw error.create({
                    name: 'ERR_PYMNT_SCHED', 
                    message: 'You cannot delete this Payment Schedule record.',
                    notifyOff: false
                }).message;
            }
        }
    }
    function beforeSubmit(context) {
        if (context.type !== context.UserEventType.CREATE && context.type !== context.UserEventType.EDIT)
            return;
        var paySchedRec = context.newRecord;
        var minDays = paySchedRec.getValue(FLD_PAYSCHED_MIN_DAYS);
        var maxDays = paySchedRec.getValue(FLD_PAYSCHED_MAX_DAYS);
        log.debug('beforeSubmit', 'paySched ID: ' + paySchedRec.id);

        if(isOverlap(paySchedRec.id, minDays, maxDays)){
            throw error.create({
                name: 'ERR_PYMNT_SCHED', 
                message: 'Payment Schedule overlaps with other Payment Schedule existing.',
                notifyOff: false
            }).message;
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
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        /*afterSubmit: afterSubmit*/
    };
});