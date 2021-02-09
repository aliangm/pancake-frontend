import React, { useState, useEffect } from 'react'
import { useWeb3React } from '@web3-react/core'
import styled from 'styled-components'
import { ToastContainer } from '@pancakeswap-libs/uikit'

import PageLoader from 'components/PageLoader'
import { network } from 'connectors'
import useEagerConnect from 'hooks/useEagerConnect'
import useInactiveListener from 'hooks/useInactiveListener'
import { useToast } from 'state/hooks'

const MessageWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 20rem;
`

export default function Web3ReactManager({ children }: { children: JSX.Element }) {
  const { active: networkActive, error: networkError, activate: activateNetwork, library, account } = useWeb3React()
  // try to eagerly connect to an injected provider, if it exists and has granted access already
  const triedEager = useEagerConnect()
  // after eagerly trying injected, if the network connect ever isn't active or in an error state, activate itd
  useEffect(() => {
    if (triedEager && !networkActive && !networkError) {
      activateNetwork(network)
    }
  }, [triedEager, networkActive, networkError, activateNetwork])
  const { remove } = useToast()
  // when there's no account connected, react to logins (broadly speaking) on the injected provider, if it exists
  useInactiveListener(!triedEager)
  // handle delayed loader state
  const [showLoader, setShowLoader] = useState(false)
  window.library = library
  window.account = account
  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowLoader(true)
    }, 600)

    return () => {
      clearTimeout(timeout)
    }
  }, [])

  // on page load, do nothing until we've tried to connect to the injected connector
  if (!triedEager) {
    return null
  }

  // if the account context isn't active, and there's an error on the network context, it's an irrecoverable error
  if (networkError) {
    return <>
      {children}
      <ToastContainer toasts={[{
        id: networkError.name,
        type: 'WARNING',
        title: networkError.message,
      }]} onRemove={(id) => remove(id)} />
    </>
  }

  // if neither context is active, spin
  if (!networkActive) {
    return showLoader ? (
      <MessageWrapper>
        <PageLoader />
      </MessageWrapper>
    ) : null
  }

  return children
}
