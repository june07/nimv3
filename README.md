![https://chromewebstore.google.com/detail/nodejs-v8-inspector-manag/gnhhdgbaldcilmgcpfddgdbkhjohddkj](https://img.shields.io/chrome-web-store/v/gnhhdgbaldcilmgcpfddgdbkhjohddkj.svg)
![https://chromewebstore.google.com/detail/nodejs-v8-inspector-manag/gnhhdgbaldcilmgcpfddgdbkhjohddkj](https://img.shields.io/chrome-web-store/users/gnhhdgbaldcilmgcpfddgdbkhjohddkj.svg)
![https://chromewebstore.google.com/detail/nodejs-v8-inspector-manag/gnhhdgbaldcilmgcpfddgdbkhjohddkj](https://img.shields.io/chrome-web-store/rating/gnhhdgbaldcilmgcpfddgdbkhjohddkj.svg)
![https://chromewebstore.google.com/detail/nodejs-v8-inspector-manag/gnhhdgbaldcilmgcpfddgdbkhjohddkj](https://img.shields.io/chrome-web-store/stars/gnhhdgbaldcilmgcpfddgdbkhjohddkj.svg)
![https://chromewebstore.google.com/detail/nodejs-v8-inspector-manag/gnhhdgbaldcilmgcpfddgdbkhjohddkj](https://img.shields.io/chrome-web-store/rating-count/gnhhdgbaldcilmgcpfddgdbkhjohddkj.svg)<br>
![https://chromewebstore.google.com/detail/nodejs-v8-inspector-manag/gnhhdgbaldcilmgcpfddgdbkhjohddkj](https://img.shields.io/badge/dynamic/json?label=microsoft%20edge%20add-on&query=%24.version&url=https%3A%2F%2Fmicrosoftedge.microsoft.com%2Faddons%2Fgetproductdetailsbycrxid%2Finjfmegnapmoakbmnmnecjabigpdjeme)
[![https://microsoftedge.microsoft.com/addons/detail/injfmegnapmoakbmnmnecjabigpdjeme](https://img.shields.io/badge/dynamic/json?label=users&query=%24.activeInstallCount&url=https%3A%2F%2Fmicrosoftedge.microsoft.com%2Faddons%2Fgetproductdetailsbycrxid%2Finjfmegnapmoakbmnmnecjabigpdjeme)](https://microsoftedge.microsoft.com/addons/detail/injfmegnapmoakbmnmnecjabigpdjeme)
[![https://microsoftedge.microsoft.com/addons/detail/injfmegnapmoakbmnmnecjabigpdjeme](https://img.shields.io/badge/dynamic/json?label=rating&query=%24.averageRating&suffix=%2F5&url=https%3A%2F%2Fmicrosoftedge.microsoft.com%2Faddons%2Fgetproductdetailsbycrxid%2Finjfmegnapmoakbmnmnecjabigpdjeme)](https://microsoftedge.microsoft.com/addons/detail/injfmegnapmoakbmnmnecjabigpdjeme)
[![https://microsoftedge.microsoft.com/addons/detail/injfmegnapmoakbmnmnecjabigpdjeme](https://img.shields.io/badge/dynamic/json?label=ratings&query=%24.ratingCount&url=https%3A%2F%2Fmicrosoftedge.microsoft.com%2Faddons%2Fgetproductdetailsbycrxid%2Finjfmegnapmoakbmnmnecjabigpdjeme)](https://microsoftedge.microsoft.com/addons/detail/injfmegnapmoakbmnmnecjabigpdjeme)

<!--The ratings badges are currently broken due to [this](https://github.com/badges/shields/issues/5475) and [this](https://github.com/pandawing/node-chrome-web-store-item-property/issues/275#issuecomment-687801815).-->

[![https://nim.june07.com](https://june07.github.io/image/smallPromoTile.png)](https://nim.june07.com) [![https://nim.june07.com](https://github.com/june07/nimv3/assets/11353590/e6f30f3f-4ae5-4831-bafa-392eaeff66fd)](https://nim.june07.com)

# NiM (Node.js --inspector Manager)
###### Streamlines your JavaScript V8 (Node.js/Deno) development process

* [Google Chrome Web Store](https://chromewebstore.google.com/detail/nodejs-v8-inspector-manag/gnhhdgbaldcilmgcpfddgdbkhjohddkj?utm_source=github&utm_medium=readme&utm_campaign=nim&utm_content=1) (works with any Chromium browsers: [Arc](https://arc.net/), [Google Chrome](https://www.google.com/chrome/), [Microsoft Edge](https://www.microsoft.com/edge), [Opera](https://www.opera.com/), [Vivaldi](https://vivaldi.com/), [Brave](https://brave.com/), [Epic](https://www.epicbrowser.com/), and more...)
* [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/nodejs-v8-inspector-ma/injfmegnapmoakbmnmnecjabigpdjeme) (works with the [Microsoft Edge](https://www.microsoft.com/edge) browser) 

## Updates:
* [https://blog.june07.com/tag/nim/](https://blog.june07.com/tag/nim/)

## Easier than `about::inspect` (`chrome://inspect/#devices`)

NiM manages the Chrome/Edge DevTools window/tab lifecycle leaving you with more ability to focus on what matters... debugging your code.

Before the problem was solved by Google, NiM was a solution that mean't you no longer need to copy/paste DevTools URL's or continue opening/closing tabs/windows, and since then it continues to offer many additional benefits outside of it's primary use case.

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

1. Install via Chrome Web Store or Microsoft Edge Add-ons
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
* [Chrome Web Store Reviews](https://chromewebstore.google.com/detail/nodejs-v8-inspector-manag/gnhhdgbaldcilmgcpfddgdbkhjohddkj)
* [Microsoft Edge Add-ons Reviews](https://microsoftedge.microsoft.com/addons/detail/nodejs-v8-inspector-ma/injfmegnapmoakbmnmnecjabigpdjeme)

Any and all feedback is encouraged and welcome. [Send us an email!](mailto:667@june07.com)

<div style="display:flex; justify-content:center;">
  <a href="https://m.do.co/c/fe4184318b19" target="_blank" rel="noopener"><IMG border="0" alt="Digitalocean $200 Credit" src="https://june07.github.io/image/digitalocean-credit.webp"></a>
</div>

***PLEASE NOTE***: Installing this does require the sharing of your email address with me (and only me). You are given other notice of this, but it's become and remains such an issue that I feel the need to make it OVER-abundantly clear. If you take issue with sharing your email address with me (mine is 667@june07.com by the way) please, I implore you to clone/fork a copy yourself and change what you don't like about the code and/or use alternate solutions (none of which are as good as NiM, but call me biased). Further feel free to contact me directly and have a chat. Unlike the behemoths like Facebook, Google, Amazon that you probably (and without hesitation) share your email address with, I actually care about the concerns of the actual people who choose to use the code I wrote (~99%) and am responsible for. Here is the privacy policy that goes along with NiM https://june07.com/privacypolicy. Thank you so much.
