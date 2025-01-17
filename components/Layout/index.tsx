import { ReactNode } from "react";
import { useStore } from "effector-react";
import Head from "next/head";
import { Header, Footer, Menu, Dashboard } from "..";
import { $menuOn } from "../../src/store/menuOn";
import {
  $modalDashboard,
  $modalNewSsi,
  $modalTx,
  $modalGetStarted,
  $modalBuyNft,
  $modalAddFunds,
  $modalWithdrawal,
} from "../../src/store/modal";

interface LayoutProps {
  children: ReactNode;
}

function LayoutSearch(props: LayoutProps) {
  const { children } = props;
  const menuOn = useStore($menuOn);
  const modalDashboard = useStore($modalDashboard);
  const modalNewSsi = useStore($modalNewSsi);
  const modalTx = useStore($modalTx);
  const modalGetStarted = useStore($modalGetStarted);
  const modalBuyNft = useStore($modalBuyNft);
  const modalAddFunds = useStore($modalAddFunds);
  const modalWithdrawal = useStore($modalWithdrawal);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Head>
        <title>SSI Browser</title>
      </Head>
      <div id="bg" />
      <div id="wrapper">
        <Header />
        {!menuOn &&
          !modalNewSsi &&
          !modalTx &&
          !modalGetStarted &&
          !modalBuyNft &&
          !modalAddFunds &&
          !modalDashboard &&
          !modalWithdrawal &&
          children}
        <Menu />
        <Dashboard />
        <Footer />
      </div>
    </div>
  );
}

export default LayoutSearch;
