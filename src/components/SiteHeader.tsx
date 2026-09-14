import Link from 'next/link'
export default function SiteHeader(){return <nav><Link href="/" className="logo"><span>KYA SCENE HAI?</span></Link><div className="navlinks"><Link href="/#stories">Stories</Link><Link href="/topics">Topics</Link><Link href="/articles">Archive</Link><Link href="/about">About</Link><a href="/#newsletter">Newsletter</a></div></nav>}
