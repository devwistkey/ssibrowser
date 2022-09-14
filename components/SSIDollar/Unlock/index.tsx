import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import * as tyron from 'tyron'
import { RootState } from '../../../src/app/reducers'
import { ZilPayBase } from '../../../components/ZilPay/zilpay-base'
import styles from './styles.module.scss'
import { updateModalTx, updateModalTxMinimized } from '../../../src/store/modal'
import { setTxId, setTxStatusLoading } from '../../../src/app/actions'

function UnlockSSIDollar({ loan, balance, balance$SI, loading, setLoading }) {
    const dispatch = useDispatch()
    const net = useSelector((state: RootState) => state.modal.net)
    const [amount, setAmount] = useState('')
    const [currency, setCurrency] = useState('')
    const $SIproxy = '0xc23cA8BE034b27B0d5d80CB08CE0EF10e336865d' // @todo

    const handleOnChange = (event: { target: { value: any; name: any } }) => {
        const input = event.target.value
        if (event.target.name === 'amountUnlock') {
            if (isNaN(input)) {
                toast.error('Please input a valid number', {
                    position: 'top-right',
                    autoClose: 2000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: 'dark',
                    toastId: 1,
                })
            } else if (input < loan.$si) {
                toast.error('You must return the total loan amount', {
                    position: 'top-right',
                    autoClose: 2000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: 'dark',
                    toastId: 1,
                })
            } else {
                setAmount(event.target.value)
            }
        }
    }

    const handleSubmitBurn = async () => {
        setLoading(true)
        const zilpay = new ZilPayBase()
        const tx_params: any[] = []
        const addrName = {
            vname: 'addrName',
            type: 'String',
            value: 'zil', //currency.toLowerCase(),
        }
        tx_params.push(addrName)
        const amount_ = {
            vname: 'amount',
            type: 'Uint128',
            value: String(Number(amount) * 1e12),
        }
        tx_params.push(amount_)

        let tx = await tyron.Init.default.transaction(net)

        dispatch(setTxStatusLoading('true'))
        resetState()
        updateModalTxMinimized(false)
        updateModalTx(true)

        switch (currency) {
            case 'zUSDT':
                break
            default:
                try {
                    await zilpay
                        .call({
                            contractAddress: $SIproxy,
                            transition: 'Burn',
                            params: tx_params as unknown as Record<
                                string,
                                unknown
                            >[],
                            amount: '0',
                        })
                        .then(async (res) => {
                            dispatch(setTxId(res.ID))
                            dispatch(setTxStatusLoading('submitted'))
                            tx = await tx.confirm(res.ID)
                            if (tx.isConfirmed()) {
                                setLoading(false)
                                dispatch(setTxStatusLoading('confirmed'))
                                setTimeout(() => {
                                    window.open(
                                        `https://devex.zilliqa.com/tx/${
                                            res.ID
                                        }?network=https%3A%2F%2F${
                                            net === 'mainnet' ? '' : 'dev-'
                                        }api.zilliqa.com`
                                    )
                                }, 1000)
                            }
                        })
                        .catch((err) => {
                            throw err
                        })
                } catch (error) {
                    setLoading(false)
                    dispatch(setTxStatusLoading('rejected'))
                    toast.error(String(error), {
                        position: 'top-right',
                        autoClose: 2000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: 'dark',
                        toastId: 12,
                    })
                }
                break
        }
    }

    const resetState = () => {
        setCurrency('')
        setLoading(false)
        setAmount('')
    }

    const spinner = (
        <i
            style={{ color: '#ffff32' }}
            className="fa fa-lg fa-spin fa-circle-notch"
            aria-hidden="true"
        ></i>
    )

    return (
        <div className={styles.contentWrapper}>
            {loading ? (
                spinner
            ) : (
                <>
                    <div style={{ marginTop: '20%' }}>
                        $SI Balance: {balance$SI} $SI
                    </div>
                    <div style={{ marginTop: '5%' }}>
                        ZIL Balance: {balance} ZIL
                    </div>
                    <div style={{ marginTop: '5%' }}>
                        $SI Loan: {loan.$si} $SI
                    </div>
                    <div style={{ marginTop: '5%' }}>
                        ZIL Locked: {loan.zil} ZIL
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            marginTop: '10%',
                        }}
                    >
                        <input
                            name="amountUnlock"
                            type="text"
                            className={styles.inputBox}
                            onChange={handleOnChange}
                            placeholder="Type the amount of $SI to return"
                            autoFocus
                        />
                        <button
                            style={{ marginLeft: '3%' }}
                            onClick={handleSubmitBurn}
                            className={`button ${
                                amount !== '' ? 'secondary' : 'primary'
                            }`}
                        >
                            <p>SUBMIT</p>
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}

export default UnlockSSIDollar
