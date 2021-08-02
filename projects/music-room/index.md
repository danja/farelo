# Music Room

**Aim** to document hardware, software, instruments etc.

## Hardware

### Computer

Startup Disk Creator is known to having issues. Use the Disks tool to create the Ubuntu USB installation medium. Open Disks and select the USB drive (on the left) to be used as medium.

Then select Restore Disk Image from the menu on the top right of the application. Choose the
Ubuntu installation ISO file - check if the USB drive to write it to is correct and Start restoring.

SSD Disk Partitions:

EFI (FAT32) 550MB

ext4 450GB

50GB free 
As of 2021-06-17

* 

## Software


### DAW

* Ardour
* Rosegarden
* qtractor

### csound

https://csound.com/frontends.html

  * csoundqt - the default
  * Cabbage - bit fancier
  * Blue - big composition thing. Has Steve Reich's 'Phase' as an example
  
### Purr Data

https://agraef.github.io/purr-data-intro/Purr-Data-Intro.html

https://github.com/agraef/purr-data

git pull https://github.com/agraef/purr-data.git

 sudo apt-get update && sudo apt-get upgrade

 sudo apt-get install bison flex automake libasound2-dev \
      libjack-jackd2-dev libtool libbluetooth-dev libgl1-mesa-dev \
      libglu1-mesa-dev libglew-dev libmagick++-dev libftgl-dev \
      libgmerlin-dev libgmerlin-avdec-dev libavifile-0.7-dev \
      libmpeg3-dev libquicktime-dev libv4l-dev libraw1394-dev \
      libdc1394-22-dev libfftw3-dev libvorbis-dev ladspa-sdk \
      dssi-dev tap-plugins invada-studio-plugins-ladspa blepvco \
      swh-plugins mcp-plugins cmt blop omins rev-plugins \
       dssi-utils vco-plugins wah-plugins fil-plugins \
      mda-lv2 libmp3lame-dev libspeex-dev libgsl0-dev \
      portaudio19-dev liblua5.3-dev python-dev libsmpeg0  \
      flite1-dev libgsm1-dev libgtk2.0-dev git libstk0-dev \
      libfluidsynth-dev fluid-soundfont-gm byacc

sudo apt install libgconf-2-4 

(a couple of the deps weren't found

