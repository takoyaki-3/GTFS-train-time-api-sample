FROM centos:centos7

RUN yum update -y
RUN yum install -y epel-release
RUN yum install -y git wget curl postgresql

# install mvn
RUN yum install python-pip -y
RUN yum install -y unzip which java-1.8.0-openjdk-devel zip
WORKDIR /root
RUN curl https://archive.apache.org/dist/maven/maven-3/3.6.1/binaries/apache-maven-3.6.1-bin.tar.gz | tar zxv
RUN mkdir /opt/maven
RUN mv apache-maven-3.6.1 /opt/maven/
RUN ln -s /opt/maven/apache-maven-3.6.1 /opt/maven/default
RUN echo 'export PATH=$PATH:/opt/maven/default/bin' | tee -a /etc/profile
RUN source /etc/profile

# install onebusaway
WORKDIR /root
RUN wget https://github.com/OneBusAway/onebusaway-gtfs-modules/archive/onebusaway-gtfs-modules-1.3.48.zip
RUN unzip onebusaway-gtfs-modules-1.3.48.zip
WORKDIR /root/onebusaway-gtfs-modules-onebusaway-gtfs-modules-1.3.48
RUN /opt/maven/default/bin/mvn install

# install gtfsdb
WORKDIR /
RUN git clone https://github.com/OpenTransitTools/gtfsdb.git
WORKDIR /gtfsdb
RUN yum install python-pip -y
RUN pip install zc.buildout
RUN pip install --upgrade pip
RUN buildout install prod postgresql

WORKDIR /volume/