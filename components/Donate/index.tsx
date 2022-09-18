import React, { useState, useCallback } from 'react'
import * as tyron from 'tyron'
import { toast } from 'react-toastify'
import { $donation, $extraZil, updateDonation } from '../../src/store/donation'
import { useSelector } from 'react-redux'
import { RootState } from '../../src/app/reducers'
import { useTranslation } from 'next-i18next'
import ContinueArrow from '../../src/assets/icons/continue_arrow.svg'
import TickIcoYellow from '../../src/assets/icons/tick.svg'
import TickIcoBlue from '../../src/assets/icons/tick_blue.svg'
import Image from 'next/image'
import smartContract from '../../src/utils/smartContract'
import { $zilpayBalance } from '../../src/store/modal'
import stylesDark from './styles.module.scss'
import stylesLight from './styleslight.module.scss'
import toastTheme from '../../src/hooks/toastTheme'

function Component() {
    const { t } = useTranslation()
    const { getSmartContract } = smartContract()
    const callbackRef = useCallback((inputElement) => {
        if (inputElement) {
            inputElement.focus()
        }
    }, [])

    const donation = $donation.getState()
    const zilBal = $zilpayBalance.getState()
    const extraZil = $extraZil.getState()
    let donation_: string | undefined
    const isZil = window.location.pathname.includes('/zil')
    const TickIco = isZil ? TickIcoBlue : TickIcoYellow

    if (donation === null) {
        donation_ = t('ZIL amount')
    } else {
        donation_ = String(donation) + ' ZIL'
    }

    const net = useSelector((state: RootState) => state.modal.net)
    const loginInfo = useSelector((state: RootState) => state.modal)
    const isLight = loginInfo.isLight
    const styles = isLight ? stylesLight : stylesDark

    const [input, setInput] = useState(0) // donation amount
    const handleInput = (event: { target: { value: any } }) => {
        updateDonation(null)
        let input = event.target.value
        const re = /,/gi
        input = input.replace(re, '.')
        input = Number(input)
        setInput(input)
        if (isNaN(input)) {
            input = 0
        }
        setInput(input)
    }
    const handleOnKeyPress = ({
        key,
    }: React.KeyboardEvent<HTMLInputElement>) => {
        if (key === 'Enter') {
            handleSubmit()
        }
    }

    const handleSubmit = async () => {
        if (Number(extraZil) > 0 && Number(zilBal) < input + Number(extraZil)) {
            toast.error('Insufficient balance', {
                position: 'top-right',
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: toastTheme(isLight),
                toastId: 1,
            })
        } else {
            updateDonation(input)
            const donation = $donation.getState()
            if (input !== 0) {
                try {
                    await tyron.SearchBarUtil.default
                        .fetchAddr(net, 'donate', '')
                        .then(async (donate_addr) => {
                            return await getSmartContract(
                                donate_addr,
                                'xpoints'
                            )
                        })
                        .then(async (balances) => {
                            return await tyron.SmartUtil.default.intoMap(
                                balances.result.xpoints
                            )
                        })
                        .then((balances_) => {
                            // Get balance of the logged in address
                            const balance = balances_.get(
                                loginInfo.zilAddr?.base16.toLowerCase()
                            )
                            if (balance !== undefined) {
                                toast.info(
                                    t(
                                        'Thank you! You are getting X xPoints. Current balance: X xPoints',
                                        {
                                            value: donation!.toFixed(2),
                                            balance: (balance / 1e12).toFixed(
                                                2
                                            ),
                                            s:
                                                Number(donation) === 1
                                                    ? ''
                                                    : 's',
                                            s2:
                                                Number(balance / 1e12) === 1
                                                    ? ''
                                                    : 's',
                                        }
                                    ),
                                    {
                                        position: 'bottom-right',
                                        autoClose: 4000,
                                        hideProgressBar: false,
                                        closeOnClick: true,
                                        pauseOnHover: true,
                                        draggable: true,
                                        progress: undefined,
                                        theme: toastTheme(isLight),
                                        toastId: 2
                                    }
                                )
                            }
                        })
                        .catch(() => {
                            throw new Error(
                                'Donate DApp: Not able to fetch balance.'
                            )
                        })
                } catch (error) {
                    toast.warning(String(error), {
                        position: 'top-right',
                        autoClose: 3000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: toastTheme(isLight),
                        toastId: 3,
                    })
                }
            } else {
                toast.info(t('Donating 0 ZIL, you will get 0 xP'), {
                    position: 'bottom-right',
                    autoClose: 2000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: toastTheme(isLight),
                    toastId: 4
                })
            }
        }
    }

    const continueBtnClassName = () => {
        if (donation === null) {
            if (isZil) {
                return 'continueBtnBlue'
            } else {
                return 'continueBtn'
            }
        } else {
            return ''
        }
    }

    return (
        <div
            style={{
                marginTop: '12%',
                marginBottom: '12%',
                width: '100%',
                textAlign: 'left',
            }}
        >
            <p style={{ color: isLight ? '#000' : '#fff' }}>
                {t('How much would you like to send to the')}{' '}
                <a
                    href="https://www.notion.so/ssiprotocol/TYRON-a-Network-for-Self-Sovereign-Identities-7bddd99a648c4849bbf270ce86c48dac#29c0e576a78b455fb23e4dcdb4107032"
                    rel="noreferrer"
                    target="_blank"
                >
                    Donate DApp
                </a>
                ?
            </p>
            <div style={{ display: 'flex' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                        ref={callbackRef}
                        className={styles.input}
                        type="text"
                        placeholder={donation_}
                        onChange={handleInput}
                        onKeyPress={handleOnKeyPress}
                        autoFocus
                    />
                    <code style={{ color: isLight ? '#000' : '#fff' }}>
                        ZIL
                    </code>
                    <code
                        style={{
                            marginLeft: '3%',
                            marginRight: '5%',
                            color: isLight ? '#000' : '#fff',
                        }}
                    >
                        = {input} xP
                    </code>
                    <div
                        className={continueBtnClassName()}
                        onClick={() => {
                            if (donation === null) {
                                handleSubmit()
                            }
                        }}
                    >
                        {donation === null ? (
                            <Image src={ContinueArrow} alt="arrow" />
                        ) : (
                            <div style={{ marginTop: '5px' }}>
                                <Image width={40} src={TickIco} alt="tick" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Component
