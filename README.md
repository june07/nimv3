![](https://img.shields.io/chrome-web-store/v/gnhhdgbaldcilmgcpfddgdbkhjohddkj.svg) ![](https://img.shields.io/badge/dynamic/json?label=microsoft%20edge%20add-on&query=%24.version&url=https%3A%2F%2Fmicrosoftedge.microsoft.com%2Faddons%2Fgetproductdetailsbycrxid%2Finjfmegnapmoakbmnmnecjabigpdjeme) ![](https://img.shields.io/chrome-web-store/users/gnhhdgbaldcilmgcpfddgdbkhjohddkj.svg) ![](https://img.shields.io/chrome-web-store/rating/gnhhdgbaldcilmgcpfddgdbkhjohddkj.svg) ![](https://img.shields.io/chrome-web-store/stars/gnhhdgbaldcilmgcpfddgdbkhjohddkj.svg) ![](https://img.shields.io/chrome-web-store/rating-count/gnhhdgbaldcilmgcpfddgdbkhjohddkj.svg)

<!--The ratings badges are currently broken due to [this](https://github.com/badges/shields/issues/5475) and [this](https://github.com/pandawing/node-chrome-web-store-item-property/issues/275#issuecomment-687801815).-->

![NiM Logo](https://june07.github.io/image/smallPromoTile.png)

![Google Reviews](https://june07.github.io/image/312uiu.gif)
# NiM (Node.js --inspector Manager)
###### Streamlines your JavaScript V8 (Node.js/Deno) development process

* [Google Chrome Web Store](http://bit.ly/2W8hQG9) (works with any Chromium browsers: [Google's Chrome](https://www.google.com/chrome/), [Microsoft's Edge](https://www.microsoftedgeinsider.com/en-us/, ), [Opera](https://www.opera.com/), [Vivaldi](https://vivaldi.com/), [Brave](https://brave.com/), [Epic](https://www.epicbrowser.com/), and more...  )
* [Microsoft Edge Addons](https://microsoftedge.microsoft.com/addons/detail/injfmegnapmoakbmnmnecjabigpdjeme) (Works with the Microsoft's Edge browser https://www.microsoftedgeinsider.com/en-us/) 

## Updates:
* [BrakeCODE + NiM Alert Feature](https://blog.june07.com/brakecode-nim-alert-feature/)

## Easier than `about::inspect (chrome://inspect/#devices)`

NiM manages the Chrome/Edge DevTools window/tab lifecycle leaving you with more ability to focus on what matters... debugging your code. Before the problem was solved by Google, NiM was a solution that mean't you no longer need to copy/paste DevTools URL's or continue opening/closing tabs/windows, and since then it continues to offer many additional benefits outside of it's primary use case. A huge one being the ability to debug REMOTE V8 processes, simply. It does so by essentially automating the process set out in Node's own documenation for [Enabling remote debugging scenarios](https://nodejs.org/en/docs/guides/debugging-getting-started/#enabling-remote-debugging-scenarios) via an [open source agent](https://github.com/june07/brakecode-node).

![BrakeCODE agent](https://camo.githubusercontent.com/7855b83247ecc58c5222c40d7a0b613772309d2f5f4c9f7d8d3bc002e36d1b12/68747470733a2f2f6769746875622e6272616b65636f64652e636f6d2f696d6167652f6272616b65636f64652d6e6f64652d6e70782d72756e2e676966)

NiM provides you with lots of options...
 
 * Manage and monitor local and remote debugging sessions
 * Manual or automatic control of DevTools interface
 * Open DevTools in a new tab or window
 * Make DevTools focused or inactive on start
 * Customize duration between v8 Inspector probes
 * Receive helpful notifications from 3rd party services such as your CI/CD pipeline
 * Work around any upstream bugs in Chrome/Edge DevTools via customized DevTools versions
 * DevTools tab grouping

## Setup / Usage / How To

Simple and basic... just install the Chrome Extension in any of the following ways:

1. Install via Chrome Web Store or Edge Add-Ons
2. Install via GitHub source by forking/cloning the repo...

```
git clone https://github.com/june07/nimv3.git
npm ci --legacy-peer-deps
npm build
```
and then [load the extension unpacked](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked)

## Need Additional Information?
* NiM post install page provides some help [https://blog.june07.com/nim-install](https://blog.june07.com/nim-install/)
* Debugging NiM itself [https://blog.june07.com/debugging-nim/](https://blog.june07.com/debugging-nim/)


#### If you enjoy using NIM please give us a 5 star rating and review
* [Chrome Web Store Review](https://chrome.google.com/webstore/detail/nodejs-v8-inspector-manag/gnhhdgbaldcilmgcpfddgdbkhjohddkj/reviews)
* [Edge Add-Ons Review](https://microsoftedge.microsoft.com/addons/detail/nodejs-v8-inspector-ma/injfmegnapmoakbmnmnecjabigpdjeme)

Any and all feedback is encouraged and welcome.  [Send us an email!](mailto:667@june07.com)

<div style="display:flex; justify-content:center;">
  <a href="https://m.do.co/c/fe4184318b19" target="_blank" rel="noopener"><IMG border="0" alt="Digitalocean $100 Credit" src="https://june07.github.io/image/digitalocean-credit.png"></a>
</div>

 ***PLEASE NOTE***: Installing this does require the sharing of your email address with me (and only me).  You are given other notice of this, but it's become and remains such an issue that I feel the need to make it OVER-abundantly clear.  If you take issue with sharing your email address with me (mine is 667@june07.com by the way) please, I implore you to clone/fork a copy yourself and change what you don't like about the code and/or use alternate solutions (none of which are as good as NiM, but call me biased).  Further feel free to contact me directly and have a chat.  Unlike the behemoths like Facebook, Google, Amazon that you probably (and without hesitation) share your email address with, I actually care about the concerns of the actual people who choose to use the code I wrote (~99%) and am responsible for.  Here is the privacy policy that goes along with NiM https://june07.com/privacypolicy.  Thank you so much.
