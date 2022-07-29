import * as tyron from 'tyron'
import { useStore } from 'effector-react'
import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { useDispatch, useSelector } from 'react-redux'
import Image from 'next/image'
import { $resolvedInfo } from '../../../../../../../src/store/resolvedInfo'
import { operationKeyPair } from '../../../../../../../src/lib/dkms'
import { ZilPayBase } from '../../../../../../ZilPay/zilpay-base'
import styles from './styles.module.scss'
import { Donate, Spinner } from '../../../../../..'
import {
    $donation,
    updateDonation,
} from '../../../../../../../src/store/donation'
import {
    updateModalTx,
    updateModalTxMinimized,
} from '../../../../../../../src/store/modal'
import {
    setTxStatusLoading,
    setTxId,
} from '../../../../../../../src/app/actions'
import { RootState } from '../../../../../../../src/app/reducers'
import { useTranslation } from 'next-i18next'
import routerHook from '../../../../../../../src/hooks/router'
import ContinueArrow from '../../../../../../../src/assets/icons/continue_arrow.svg'
import TickIco from '../../../../../../../src/assets/icons/tick_blue.svg'
import defaultCheckmark from '../../../../../../../src/assets/icons/default_checkmark.svg'
import selectedCheckmark from '../../../../../../../src/assets/icons/selected_checkmark.svg'
import smartContract from '../../../../../../../src/utils/smartContract'
import { $arconnect } from '../../../../../../../src/store/arconnect'

function Component({ dapp }: { dapp: string }) {
    const zcrypto = tyron.Util.default.Zcrypto()
    const { t } = useTranslation()
    const dispatch = useDispatch()
    const { navigate } = routerHook()
    const { getSmartContract } = smartContract()
    const resolvedInfo = useStore($resolvedInfo)
    const username = resolvedInfo?.name
    const donation = useStore($donation)
    const net = useSelector((state: RootState) => state.modal.net)
    const arConnect = useStore($arconnect)

    const [didDomain, setDidDomain] = useState('') // the DID Domain
    const [input, setInput] = useState('') // the domain address
    const [legend, setLegend] = useState('save')
    const [legend2, setLegend2] = useState('save')
    const [deployed, setDeployed] = useState(false)
    const [showInput, setShowInput] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleInputDomain = (event: { target: { value: any } }) => {
        updateDonation(null)
        setDidDomain('')
        setInput('')
        setLegend2('save')
        const input = event.target.value
        setDidDomain(input)
    }

    const handleSaveDomain = async () => {
        if (didDomain !== '' && didDomain !== 'did' && didDomain !== 'tyron') {
            //@todo-i-fixed also make sure that the input domain does not exist in the did_domain_dns already
            setLoading(true)
            getSmartContract(resolvedInfo?.addr!, 'did_domain_dns').then(
                async (res) => {
                    const key = Object.keys(res.result.did_domain_dns)
                    if (key.some((val) => val === didDomain)) {
                        toast.error(t('Domain already exist'), {
                            position: 'top-right',
                            autoClose: 2000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                            theme: 'dark',
                            toastId: 5,
                        })
                        setLoading(false)
                    } else {
                        setLegend2('saved')
                        setLoading(false)
                    }
                }
            )
        } else {
            toast.warn(t('Invalid.'), {
                position: 'top-right',
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: 'dark',
                toastId: 5,
            })
        }
    }

    const handleSave = async () => {
        const addr = tyron.Address.default.verification(input)
        if (addr !== '') {
            setLegend('saved')
        } else {
            toast.error(t('Wrong address.'), {
                position: 'top-right',
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: 'dark',
                toastId: 5,
            })
        }
    }

    const handleInput = (event: { target: { value: any } }) => {
        updateDonation(null)
        setInput('')
        setLegend('save') //@todo-i-fixed update to => and tick (saved)
        setInput(event.target.value)
    }

    const handleOnKeyPressAddr = ({
        key,
    }: React.KeyboardEvent<HTMLInputElement>) => {
        if (key === 'Enter') {
            handleSave()
        }
    }

    const handleOnKeyPressDomain = ({
        key,
    }: React.KeyboardEvent<HTMLInputElement>) => {
        if (key === 'Enter') {
            handleSaveDomain()
        }
    }

    const handleDeploy = async () => {
        if (resolvedInfo !== null && net !== null) {
            const zilpay = new ZilPayBase()
            await zilpay
                .deployDomainBeta(net, username!)
                .then((deploy: any) => {
                    let addr = deploy[1].address
                    addr = zcrypto.toChecksumAddress(addr)
                    setInput(addr)
                    setDeployed(true)
                })
        } else {
            toast.error('Some data is missing.', {
                position: 'top-right',
                autoClose: 6000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: 'dark',
            })
        }
    }

    const handleSubmit = async () => {
        try {
            if (arConnect === null) {
                toast.warning('Connect with ArConnect.', {
                    position: 'top-center',
                    autoClose: 2000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: 'dark',
                })
            } else if (resolvedInfo !== null && donation !== null) {
                const zilpay = new ZilPayBase()
                const txID = 'Dns'
                let addr: string
                if (deployed === true) {
                    addr = zcrypto.toChecksumAddress(input)
                } else {
                    addr = input
                }
                const result = await operationKeyPair({
                    arConnect: arConnect,
                    id: didDomain,
                    addr: resolvedInfo.addr,
                })
                const did_key = result.element.key.key
                const encrypted = result.element.key.encrypted

                let tyron_: tyron.TyronZil.TransitionValue
                tyron_ = await tyron.Donation.default.tyron(donation)

                const tx_params = await tyron.TyronZil.default.Dns(
                    addr,
                    didDomain,
                    did_key,
                    encrypted,
                    tyron_
                )

                const _amount = String(donation)

                dispatch(setTxStatusLoading('true'))
                updateModalTxMinimized(false)
                updateModalTx(true)
                let tx = await tyron.Init.default.transaction(net)
                await zilpay
                    .call({
                        contractAddress: resolvedInfo?.addr!,
                        transition: txID,
                        params: tx_params as unknown as Record<
                            string,
                            unknown
                        >[],
                        amount: _amount,
                    })
                    .then(async (res) => {
                        dispatch(setTxId(res.ID))
                        dispatch(setTxStatusLoading('submitted'))
                        try {
                            tx = await tx.confirm(res.ID)
                            if (tx.isConfirmed()) {
                                dispatch(setTxStatusLoading('confirmed'))
                                updateDonation(null)
                                window.open(
                                    `https://devex.zilliqa.com/tx/${
                                        res.ID
                                    }?network=https%3A%2F%2F${
                                        net === 'mainnet' ? '' : 'dev-'
                                    }api.zilliqa.com`
                                )
                                //@todo-i-fixed update prev is needed here?: yes, it would be better to use global navigation
                                navigate(`/${username}/zil`)
                            } else if (tx.isRejected()) {
                                dispatch(setTxStatusLoading('failed'))
                                setTimeout(() => {
                                    toast.error(t('Transaction failed.'), {
                                        position: 'top-right',
                                        autoClose: 3000,
                                        hideProgressBar: false,
                                        closeOnClick: true,
                                        pauseOnHover: true,
                                        draggable: true,
                                        progress: undefined,
                                        theme: 'dark',
                                    })
                                }, 1000)
                            }
                        } catch (err) {
                            updateModalTx(false)
                            toast.error(String(err), {
                                position: 'top-right',
                                autoClose: 3000,
                                hideProgressBar: false,
                                closeOnClick: true,
                                pauseOnHover: true,
                                draggable: true,
                                progress: undefined,
                                theme: 'dark',
                            })
                        }
                    })
                    .catch((error) => {
                        dispatch(setTxStatusLoading('rejected'))
                        updateModalTxMinimized(false)
                        updateModalTx(true)
                        toast.error(String(error), {
                            position: 'top-right',
                            autoClose: 3000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                            theme: 'dark',
                        })
                    })
            }
        } catch (error) {
            toast.error(String(error), {
                position: 'top-right',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: 'dark',
            })
        }
    }

    return (
        <div style={{ textAlign: 'center' }}>
            {/* @todo-i-fixed
            - dapp name depends on dapp input => if dapp = "zilstake" then title is ZIL Staking Wallet
            - add more top/bottom margins
            */}
            <p>DApp: {dapp === 'zilstake' ? 'ZIL Staking Wallet' : ''}</p>
            <section className={styles.container}>
                <input
                    style={{ width: '100%', marginRight: '20px' }}
                    type="text"
                    placeholder="Type DID Domain"
                    onChange={handleInputDomain}
                    onKeyPress={handleOnKeyPressDomain}
                    autoFocus
                />
                {/* @todo-i-fixed add (continue => / saved) */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div
                        className={legend2 === 'save' ? 'continueBtnBlue' : ''}
                        onClick={() => {
                            handleSaveDomain()
                        }}
                    >
                        {legend2 === 'save' ? (
                            <>
                                {loading ? (
                                    <Spinner />
                                ) : (
                                    <Image src={ContinueArrow} alt="arrow" />
                                )}
                            </>
                        ) : (
                            <div style={{ marginTop: '5px' }}>
                                <Image width={40} src={TickIco} alt="tick" />
                            </div>
                        )}
                    </div>
                </div>
            </section>
            {legend2 === 'saved' && (
                <>
                    {legend === 'save' && (
                        <button
                            className="button"
                            value={`new ${username}.${didDomain} domain`}
                            style={{ marginBottom: '10%' }}
                            onClick={handleDeploy}
                        >
                            <p>
                                New{' '}
                                <span className={styles.username}>
                                    {username}.{didDomain}
                                </span>{' '}
                                DID Domain
                            </p>
                        </button>
                    )}
                    {!deployed && (
                        <div style={{ marginTop: '5%' }}>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                            >
                                {/* @todo-i-fixed add tick box, and show the following input only if this option is selected by the user */}
                                <div
                                    onClick={() => setShowInput(!showInput)}
                                    className={styles.optionIco}
                                >
                                    <Image
                                        src={
                                            showInput
                                                ? selectedCheckmark
                                                : defaultCheckmark
                                        }
                                        alt="arrow"
                                    />
                                </div>
                                <div>
                                    Or type the address you want to save in your
                                    DID Domain:
                                </div>
                            </div>
                            {showInput && (
                                <section className={styles.container}>
                                    <input
                                        style={{
                                            width: '70%',
                                            marginRight: '20px',
                                        }}
                                        type="text"
                                        placeholder="Type address"
                                        onChange={handleInput}
                                        onKeyPress={handleOnKeyPressAddr}
                                        autoFocus
                                    />
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <div
                                            className={
                                                legend === 'save'
                                                    ? 'continueBtnBlue'
                                                    : ''
                                            }
                                            onClick={() => {
                                                handleSave()
                                            }}
                                        >
                                            {legend === 'save' ? (
                                                <Image
                                                    src={ContinueArrow}
                                                    alt="arrow"
                                                />
                                            ) : (
                                                <div
                                                    style={{ marginTop: '5px' }}
                                                >
                                                    <Image
                                                        width={40}
                                                        src={TickIco}
                                                        alt="tick"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>
                            )}
                        </div>
                    )}
                    {legend === 'saved' && <Donate />}
                    {legend === 'saved' && donation !== null && (
                        <div style={{ marginTop: '14%', textAlign: 'center' }}>
                            <button className="button" onClick={handleSubmit}>
                                <p>
                                    Save{' '}
                                    <span className={styles.username}>
                                        {username}.{didDomain}
                                    </span>{' '}
                                    DID Domain
                                </p>
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

export default Component
